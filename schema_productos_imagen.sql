USE farmacia_db;

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(255) NULL;

UPDATE productos SET imagen_url = 'assets/productos/analgesicos.svg' WHERE nombre LIKE '%Paracetamol%';
UPDATE productos SET imagen_url = 'assets/productos/vitaminas.svg' WHERE nombre LIKE '%Vitamina%';
UPDATE productos SET imagen_url = 'assets/productos/analgesicos.svg' WHERE nombre LIKE '%Ibuprofeno%';
UPDATE productos SET imagen_url = 'assets/productos/respiratorio.svg' WHERE nombre LIKE '%Jarabe%';
UPDATE productos SET imagen_url = 'assets/productos/dermatologia.svg' WHERE nombre LIKE '%Solar%';
UPDATE productos SET imagen_url = 'assets/productos/higiene.svg' WHERE nombre LIKE '%Alcohol%';
UPDATE productos SET imagen_url = 'assets/productos/equipos.svg' WHERE nombre LIKE '%Term%';
