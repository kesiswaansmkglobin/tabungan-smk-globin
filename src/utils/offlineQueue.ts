// Offline Transaction Queue with IndexedDB
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const DB_NAME = 'TabunganOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingTransactions';

interface PendingTransaction {
  id: string;
  student_id: string;
  jenis: 'Setor' | 'Tarik';
  jumlah: number;
  saldo_setelah: number;
  tanggal: string;
  keterangan: string | null;
  admin: string;
  created_at: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

// Open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  });
};

// Add transaction to queue
export const addToQueue = async (transaction: Omit<PendingTransaction, 'id' | 'status' | 'retryCount' | 'created_at'>): Promise<string> => {
  const db = await openDB();
  const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const pendingTx: PendingTransaction = {
    ...transaction,
    id,
    status: 'pending',
    retryCount: 0,
    created_at: new Date().toISOString()
  };
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(pendingTx);
    
    request.onsuccess = () => {
      db.close();
      resolve(id);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Get all pending transactions
export const getPendingTransactions = async (): Promise<PendingTransaction[]> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      db.close();
      resolve(request.result || []);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Update transaction status
export const updateTransactionStatus = async (id: string, status: PendingTransaction['status'], retryCount?: number): Promise<void> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const transaction = getRequest.result;
      if (transaction) {
        transaction.status = status;
        if (retryCount !== undefined) {
          transaction.retryCount = retryCount;
        }
        store.put(transaction);
      }
      db.close();
      resolve();
    };
    getRequest.onerror = () => {
      db.close();
      reject(getRequest.error);
    };
  });
};

// Remove transaction from queue
export const removeFromQueue = async (id: string): Promise<void> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Sync a single transaction
const syncTransaction = async (pendingTx: PendingTransaction): Promise<boolean> => {
  try {
    await updateTransactionStatus(pendingTx.id, 'syncing');
    
    // First get current student saldo
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('saldo')
      .eq('id', pendingTx.student_id)
      .single();
    
    if (studentError) throw studentError;
    
    // Recalculate saldo based on current state
    const currentSaldo = student.saldo;
    const newSaldo = pendingTx.jenis === 'Setor' 
      ? currentSaldo + pendingTx.jumlah 
      : currentSaldo - pendingTx.jumlah;
    
    // Check for negative balance
    if (newSaldo < 0) {
      throw new Error('Saldo tidak mencukupi untuk transaksi offline');
    }
    
    // Update student saldo
    const { error: updateError } = await supabase
      .from('students')
      .update({ saldo: newSaldo })
      .eq('id', pendingTx.student_id);
    
    if (updateError) throw updateError;
    
    // Insert transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert([{
        student_id: pendingTx.student_id,
        jenis: pendingTx.jenis,
        jumlah: pendingTx.jumlah,
        saldo_setelah: newSaldo,
        tanggal: pendingTx.tanggal,
        keterangan: pendingTx.keterangan,
        admin: pendingTx.admin
      }]);
    
    if (txError) throw txError;
    
    // Remove from queue on success
    await removeFromQueue(pendingTx.id);
    return true;
  } catch (error) {
    console.error('Error syncing transaction:', error);
    await updateTransactionStatus(pendingTx.id, 'failed', pendingTx.retryCount + 1);
    return false;
  }
};

// Sync all pending transactions
export const syncAllPending = async (): Promise<{ success: number; failed: number }> => {
  const pending = await getPendingTransactions();
  const pendingOnly = pending.filter(t => t.status === 'pending' || t.status === 'failed');
  
  let success = 0;
  let failed = 0;
  
  for (const tx of pendingOnly) {
    // Skip if too many retries
    if (tx.retryCount >= 3) {
      failed++;
      continue;
    }
    
    const result = await syncTransaction(tx);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }
  
  return { success, failed };
};

// Check online status and auto-sync
export const initializeOfflineSync = () => {
  const handleOnline = async () => {
    console.log('Back online - syncing pending transactions...');
    const pending = await getPendingTransactions();
    
    if (pending.length > 0) {
      toast({
        title: "Sinkronisasi Dimulai",
        description: `Menyinkronkan ${pending.length} transaksi offline...`,
      });
      
      const result = await syncAllPending();
      
      if (result.success > 0) {
        toast({
          title: "Sinkronisasi Berhasil",
          description: `${result.success} transaksi berhasil disinkronkan`,
        });
      }
      
      if (result.failed > 0) {
        toast({
          title: "Beberapa Gagal",
          description: `${result.failed} transaksi gagal disinkronkan`,
          variant: "destructive",
        });
      }
    }
  };
  
  window.addEventListener('online', handleOnline);
  
  // Initial check
  if (navigator.onLine) {
    handleOnline();
  }
  
  return () => {
    window.removeEventListener('online', handleOnline);
  };
};

// Get count of pending transactions
export const getPendingCount = async (): Promise<number> => {
  const pending = await getPendingTransactions();
  return pending.filter(t => t.status === 'pending' || t.status === 'failed').length;
};

// Check if we're online
export const isOnline = (): boolean => {
  return navigator.onLine;
};
