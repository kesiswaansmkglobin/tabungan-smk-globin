-- Add foreign key constraint between wali_kelas and classes
ALTER TABLE public.wali_kelas 
ADD CONSTRAINT fk_wali_kelas_class 
FOREIGN KEY (kelas_id) 
REFERENCES public.classes(id) 
ON DELETE RESTRICT;