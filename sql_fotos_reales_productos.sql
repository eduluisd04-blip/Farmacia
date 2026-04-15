USE farmacia_db;

-- 1) Ejecuta esto solo una vez (si no existe la columna):
-- ALTER TABLE productos ADD COLUMN imagen_url VARCHAR(255) NULL;

-- 2) Guarda tus fotos reales en:
-- tienda/assets/productos/
-- Ejemplo: tienda/assets/productos/paracetamol-500mg.jpg

-- 3) Asigna cada foto al producto:
UPDATE productos SET imagen_url = 'assets/productos/paracetamol-500mg.jpg' WHERE nombre = 'Paracetamol 500mg';
UPDATE productos SET imagen_url = 'assets/productos/vitamina-c-1000mg.jpg' WHERE nombre = 'Vitamina C 1000mg';
UPDATE productos SET imagen_url = 'assets/productos/ibuprofeno-400mg.jpg' WHERE nombre = 'Ibuprofeno 400mg';
UPDATE productos SET imagen_url = 'assets/productos/jarabe-para-tos.jpg' WHERE nombre = 'Jarabe para tos';
UPDATE productos SET imagen_url = 'assets/productos/protector-solar-spf50.jpg' WHERE nombre = 'Protector solar SPF50';
UPDATE productos SET imagen_url = 'assets/productos/alcohol-gel-500ml.jpg' WHERE nombre = 'Alcohol gel 500ml';
UPDATE productos SET imagen_url = 'assets/productos/suero-oral.jpg' WHERE nombre = 'Suero oral';
UPDATE productos SET imagen_url = 'assets/productos/termometro-digital.jpg' WHERE nombre = 'Termómetro digital';

UPDATE productos SET imagen_url = 'assets/productos/omeprazol-20mg.jpg' WHERE nombre = 'Omeprazol 20mg';
UPDATE productos SET imagen_url = 'assets/productos/loratadina-10mg.jpg' WHERE nombre = 'Loratadina 10mg';
UPDATE productos SET imagen_url = 'assets/productos/diclofenaco-gel-30g.jpg' WHERE nombre = 'Diclofenaco Gel 30g';
UPDATE productos SET imagen_url = 'assets/productos/amoxicilina-500mg.jpg' WHERE nombre = 'Amoxicilina 500mg';
UPDATE productos SET imagen_url = 'assets/productos/cetirizina-10mg.jpg' WHERE nombre = 'Cetirizina 10mg';
UPDATE productos SET imagen_url = 'assets/productos/acetaminofen-infantil.jpg' WHERE nombre = 'Acetaminofen Infantil';
UPDATE productos SET imagen_url = 'assets/productos/suplemento-zinc-50mg.jpg' WHERE nombre = 'Suplemento Zinc 50mg';
UPDATE productos SET imagen_url = 'assets/productos/omega-3-1000mg.jpg' WHERE nombre = 'Omega 3 1000mg';
UPDATE productos SET imagen_url = 'assets/productos/clotrimazol-crema-1.jpg' WHERE nombre = 'Clotrimazol Crema 1%';
UPDATE productos SET imagen_url = 'assets/productos/bloqueador-solar-spf70.jpg' WHERE nombre = 'Bloqueador Solar SPF 70';
UPDATE productos SET imagen_url = 'assets/productos/gotas-oftalmicas-lubricantes.jpg' WHERE nombre = 'Gotas Oftalmicas Lubricantes';
UPDATE productos SET imagen_url = 'assets/productos/tensiometro-digital.jpg' WHERE nombre = 'Tensiometro Digital';
UPDATE productos SET imagen_url = 'assets/productos/nebulizador-compacto.jpg' WHERE nombre = 'Nebulizador Compacto';
UPDATE productos SET imagen_url = 'assets/productos/multivitaminico-mujer.jpg' WHERE nombre = 'Multivitaminico Mujer';
UPDATE productos SET imagen_url = 'assets/productos/multivitaminico-hombre.jpg' WHERE nombre = 'Multivitaminico Hombre';
UPDATE productos SET imagen_url = 'assets/productos/jarabe-expectorante.jpg' WHERE nombre = 'Jarabe Expectorante';
UPDATE productos SET imagen_url = 'assets/productos/pastillas-para-la-garganta.jpg' WHERE nombre = 'Pastillas para la Garganta';
UPDATE productos SET imagen_url = 'assets/productos/alcohol-isopropilico-70.jpg' WHERE nombre = 'Alcohol Isopropilico 70%';
UPDATE productos SET imagen_url = 'assets/productos/guantes-desechables-x100.jpg' WHERE nombre = 'Guantes Desechables x100';
UPDATE productos SET imagen_url = 'assets/productos/termometro-infrarrojo.jpg' WHERE nombre = 'Termometro Infrarrojo';

-- 4) Verifica:
SELECT id, nombre, imagen_url FROM productos ORDER BY id;
