-- ============================================================
-- CARE4SUCCESS — seed géographique (Cameroun + pays voisins)
-- status = active (validé directement)
-- ============================================================

SET NAMES utf8mb4;

-- ── PAYS ───────────────────────────────────────────────────
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1, 'Cameroun',       'country', NULL, NULL, NULL, NULL, NULL, 'active'),
(2, 'Congo RDC',      'country', NULL, NULL, NULL, NULL, NULL, 'active'),
(3, 'Gabon',          'country', NULL, NULL, NULL, NULL, NULL, 'active'),
(4, 'Côte d''Ivoire', 'country', NULL, NULL, NULL, NULL, NULL, 'active'),
(5, 'Sénégal',        'country', NULL, NULL, NULL, NULL, NULL, 'active'),
(6, 'France',         'country', NULL, NULL, NULL, NULL, NULL, 'active'),
(7, 'Belgique',       'country', NULL, NULL, NULL, NULL, NULL, 'active');

-- ── RÉGIONS (Cameroun) ─────────────────────────────────────
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10, 'Centre',        'region', 1, 1, NULL, NULL, NULL, 'active'),
(11, 'Littoral',      'region', 1, 1, NULL, NULL, NULL, 'active'),
(12, 'Ouest',         'region', 1, 1, NULL, NULL, NULL, 'active'),
(13, 'Sud-Ouest',     'region', 1, 1, NULL, NULL, NULL, 'active'),
(14, 'Nord-Ouest',    'region', 1, 1, NULL, NULL, NULL, 'active'),
(15, 'Sud',           'region', 1, 1, NULL, NULL, NULL, 'active'),
(16, 'Est',           'region', 1, 1, NULL, NULL, NULL, 'active'),
(17, 'Adamaoua',      'region', 1, 1, NULL, NULL, NULL, 'active'),
(18, 'Nord',          'region', 1, 1, NULL, NULL, NULL, 'active'),
(19, 'Extrême-Nord',  'region', 1, 1, NULL, NULL, NULL, 'active');

-- ── DÉPARTEMENTS ───────────────────────────────────────────
-- Région Centre
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(100, 'Mfoundi',          'department', 10, 1, 10, NULL, NULL, 'active'),
(101, 'Lekie',            'department', 10, 1, 10, NULL, NULL, 'active'),
(102, 'Méfou-et-Akono',   'department', 10, 1, 10, NULL, NULL, 'active'),
(103, 'Nyong-et-So''o',   'department', 10, 1, 10, NULL, NULL, 'active'),
(104, 'Mbam-et-Inoubou',  'department', 10, 1, 10, NULL, NULL, 'active'),
(105, 'Haute-Sanaga',     'department', 10, 1, 10, NULL, NULL, 'active');

-- Région Littoral
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(110, 'Wouri',            'department', 11, 1, 11, NULL, NULL, 'active'),
(111, 'Moungo',           'department', 11, 1, 11, NULL, NULL, 'active'),
(112, 'Nkam',             'department', 11, 1, 11, NULL, NULL, 'active'),
(113, 'Sanaga-Maritime',  'department', 11, 1, 11, NULL, NULL, 'active');

-- Région Ouest
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(120, 'Mifi',             'department', 12, 1, 12, NULL, NULL, 'active'),
(121, 'Bamboutos',        'department', 12, 1, 12, NULL, NULL, 'active'),
(122, 'Haut-Nkam',        'department', 12, 1, 12, NULL, NULL, 'active'),
(123, 'Noun',             'department', 12, 1, 12, NULL, NULL, 'active'),
(124, 'Menoua',           'department', 12, 1, 12, NULL, NULL, 'active');

-- Région Sud-Ouest
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(130, 'Fako',             'department', 13, 1, 13, NULL, NULL, 'active'),
(131, 'Meme',             'department', 13, 1, 13, NULL, NULL, 'active'),
(132, 'Kupe-Muanenguba',  'department', 13, 1, 13, NULL, NULL, 'active'),
(133, 'Lebialem',         'department', 13, 1, 13, NULL, NULL, 'active');

-- Région Nord-Ouest
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(140, 'Mezam',            'department', 14, 1, 14, NULL, NULL, 'active'),
(141, 'Momo',             'department', 14, 1, 14, NULL, NULL, 'active'),
(142, 'Bui',              'department', 14, 1, 14, NULL, NULL, 'active'),
(143, 'Donga-Mantung',    'department', 14, 1, 14, NULL, NULL, 'active');

-- Région Sud
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(150, 'Mvila',            'department', 15, 1, 15, NULL, NULL, 'active'),
(151, 'Ocean',            'department', 15, 1, 15, NULL, NULL, 'active'),
(152, 'Vallée-du-Ntem',   'department', 15, 1, 15, NULL, NULL, 'active');

-- Région Est
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(160, 'Lom-et-Djérem',   'department', 16, 1, 16, NULL, NULL, 'active'),
(161, 'Haut-Nyong',       'department', 16, 1, 16, NULL, NULL, 'active'),
(162, 'Kadey',            'department', 16, 1, 16, NULL, NULL, 'active');

-- Région Adamaoua
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(170, 'Vina',             'department', 17, 1, 17, NULL, NULL, 'active'),
(171, 'Mbere',            'department', 17, 1, 17, NULL, NULL, 'active'),
(172, 'Djérem',           'department', 17, 1, 17, NULL, NULL, 'active');

-- Région Nord
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(180, 'Bénoué',           'department', 18, 1, 18, NULL, NULL, 'active'),
(181, 'Mayo-Louti',       'department', 18, 1, 18, NULL, NULL, 'active'),
(182, 'Faro',             'department', 18, 1, 18, NULL, NULL, 'active');

-- Région Extrême-Nord
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(190, 'Diamaré',          'department', 19, 1, 19, NULL, NULL, 'active'),
(191, 'Mayo-Sava',        'department', 19, 1, 19, NULL, NULL, 'active'),
(192, 'Mayo-Tsanaga',     'department', 19, 1, 19, NULL, NULL, 'active'),
(193, 'Logone-et-Chari',  'department', 19, 1, 19, NULL, NULL, 'active');

-- ── ARRONDISSEMENTS ────────────────────────────────────────
-- Mfoundi → Yaoundé
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1000, 'Yaoundé 1er',  'arrondissement', 100, 1, 10, 100, NULL, 'active'),
(1001, 'Yaoundé 2ème', 'arrondissement', 100, 1, 10, 100, NULL, 'active'),
(1002, 'Yaoundé 3ème', 'arrondissement', 100, 1, 10, 100, NULL, 'active'),
(1003, 'Yaoundé 4ème', 'arrondissement', 100, 1, 10, 100, NULL, 'active'),
(1004, 'Yaoundé 5ème', 'arrondissement', 100, 1, 10, 100, NULL, 'active'),
(1005, 'Yaoundé 6ème', 'arrondissement', 100, 1, 10, 100, NULL, 'active'),
(1006, 'Yaoundé 7ème', 'arrondissement', 100, 1, 10, 100, NULL, 'active');

-- Lekie
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1007, 'Monatele',    'arrondissement', 101, 1, 10, 101, NULL, 'active'),
(1008, 'Obala',       'arrondissement', 101, 1, 10, 101, NULL, 'active'),
(1009, 'Batchenga',   'arrondissement', 101, 1, 10, 101, NULL, 'active');

-- Wouri → Douala
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1010, 'Douala 1er',  'arrondissement', 110, 1, 11, 110, NULL, 'active'),
(1011, 'Douala 2ème', 'arrondissement', 110, 1, 11, 110, NULL, 'active'),
(1012, 'Douala 3ème', 'arrondissement', 110, 1, 11, 110, NULL, 'active'),
(1013, 'Douala 4ème', 'arrondissement', 110, 1, 11, 110, NULL, 'active'),
(1014, 'Douala 5ème', 'arrondissement', 110, 1, 11, 110, NULL, 'active');

-- Moungo
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1015, 'Nkongsamba 1er', 'arrondissement', 111, 1, 11, 111, NULL, 'active'),
(1016, 'Nkongsamba 2ème', 'arrondissement', 111, 1, 11, 111, NULL, 'active'),
(1017, 'Melong',          'arrondissement', 111, 1, 11, 111, NULL, 'active');

-- Mifi → Bafoussam
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1020, 'Bafoussam 1er',  'arrondissement', 120, 1, 12, 120, NULL, 'active'),
(1021, 'Bafoussam 2ème', 'arrondissement', 120, 1, 12, 120, NULL, 'active'),
(1022, 'Bafoussam 3ème', 'arrondissement', 120, 1, 12, 120, NULL, 'active');

-- Bamboutos
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1023, 'Mbouda',        'arrondissement', 121, 1, 12, 121, NULL, 'active'),
(1024, 'Babadjou',      'arrondissement', 121, 1, 12, 121, NULL, 'active');

-- Mezam → Bamenda
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1030, 'Bamenda 1er',  'arrondissement', 140, 1, 14, 140, NULL, 'active'),
(1031, 'Bamenda 2ème', 'arrondissement', 140, 1, 14, 140, NULL, 'active'),
(1032, 'Bamenda 3ème', 'arrondissement', 140, 1, 14, 140, NULL, 'active');

-- Fako → Buea / Limbe
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1040, 'Buea',          'arrondissement', 130, 1, 13, 130, NULL, 'active'),
(1041, 'Limbe 1er',     'arrondissement', 130, 1, 13, 130, NULL, 'active'),
(1042, 'Limbe 2ème',    'arrondissement', 130, 1, 13, 130, NULL, 'active'),
(1043, 'Limbe 3ème',    'arrondissement', 130, 1, 13, 130, NULL, 'active'),
(1044, 'Tiko',          'arrondissement', 130, 1, 13, 130, NULL, 'active');

-- Mvila → Ebolowa
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1050, 'Ebolowa 1er',  'arrondissement', 150, 1, 15, 150, NULL, 'active'),
(1051, 'Ebolowa 2ème', 'arrondissement', 150, 1, 15, 150, NULL, 'active');

-- Lom-et-Djérem → Bertoua
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1060, 'Bertoua 1er',  'arrondissement', 160, 1, 16, 160, NULL, 'active'),
(1061, 'Bertoua 2ème', 'arrondissement', 160, 1, 16, 160, NULL, 'active');

-- Vina → Ngaoundéré
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1070, 'Ngaoundéré 1er',  'arrondissement', 170, 1, 17, 170, NULL, 'active'),
(1071, 'Ngaoundéré 2ème', 'arrondissement', 170, 1, 17, 170, NULL, 'active'),
(1072, 'Ngaoundéré 3ème', 'arrondissement', 170, 1, 17, 170, NULL, 'active');

-- Bénoué → Garoua
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1080, 'Garoua 1er',  'arrondissement', 180, 1, 18, 180, NULL, 'active'),
(1081, 'Garoua 2ème', 'arrondissement', 180, 1, 18, 180, NULL, 'active'),
(1082, 'Garoua 3ème', 'arrondissement', 180, 1, 18, 180, NULL, 'active');

-- Diamaré → Maroua
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(1090, 'Maroua 1er',  'arrondissement', 190, 1, 19, 190, NULL, 'active'),
(1091, 'Maroua 2ème', 'arrondissement', 190, 1, 19, 190, NULL, 'active'),
(1092, 'Maroua 3ème', 'arrondissement', 190, 1, 19, 190, NULL, 'active');

-- ── QUARTIERS ──────────────────────────────────────────────
-- Yaoundé 1er (Centre Admin, Bastos, Nlongkak…)
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10000, 'Bastos',              'quartier', 1000, 1, 10, 100, 1000, 'active'),
(10001, 'Nlongkak',            'quartier', 1000, 1, 10, 100, 1000, 'active'),
(10002, 'Centre Administratif','quartier', 1000, 1, 10, 100, 1000, 'active'),
(10003, 'Hippodrome',          'quartier', 1000, 1, 10, 100, 1000, 'active'),
(10004, 'Quartier du Lac',     'quartier', 1000, 1, 10, 100, 1000, 'active');

-- Yaoundé 2ème
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10010, 'Melen',        'quartier', 1001, 1, 10, 100, 1001, 'active'),
(10011, 'Tsinga',       'quartier', 1001, 1, 10, 100, 1001, 'active'),
(10012, 'Obili',        'quartier', 1001, 1, 10, 100, 1001, 'active'),
(10013, 'Elig-Essono',  'quartier', 1001, 1, 10, 100, 1001, 'active'),
(10014, 'Ekounou',      'quartier', 1001, 1, 10, 100, 1001, 'active');

-- Yaoundé 3ème
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10020, 'Biyem-Assi',   'quartier', 1002, 1, 10, 100, 1002, 'active'),
(10021, 'Mimboman',     'quartier', 1002, 1, 10, 100, 1002, 'active'),
(10022, 'Nkomo',        'quartier', 1002, 1, 10, 100, 1002, 'active'),
(10023, 'Etoug-Ebe',    'quartier', 1002, 1, 10, 100, 1002, 'active');

-- Yaoundé 4ème
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10030, 'Mvog-Mbi',     'quartier', 1003, 1, 10, 100, 1003, 'active'),
(10031, 'Mvog-Betsi',   'quartier', 1003, 1, 10, 100, 1003, 'active'),
(10032, 'Essos',        'quartier', 1003, 1, 10, 100, 1003, 'active'),
(10033, 'Nkol-Eton',    'quartier', 1003, 1, 10, 100, 1003, 'active'),
(10034, 'Madagascar',   'quartier', 1003, 1, 10, 100, 1003, 'active');

-- Yaoundé 5ème
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10040, 'Messa',        'quartier', 1004, 1, 10, 100, 1004, 'active'),
(10041, 'Briqueterie',  'quartier', 1004, 1, 10, 100, 1004, 'active'),
(10042, 'Nkol-Afeme',   'quartier', 1004, 1, 10, 100, 1004, 'active'),
(10043, 'Omnisport',    'quartier', 1004, 1, 10, 100, 1004, 'active');

-- Yaoundé 6ème
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10050, 'Ngoa-Ekele',   'quartier', 1005, 1, 10, 100, 1005, 'active'),
(10051, 'Kondengui',    'quartier', 1005, 1, 10, 100, 1005, 'active'),
(10052, 'Mendong',      'quartier', 1005, 1, 10, 100, 1005, 'active');

-- Yaoundé 7ème
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10060, 'Nkolbisson',   'quartier', 1006, 1, 10, 100, 1006, 'active'),
(10061, 'Nkolfoulou',   'quartier', 1006, 1, 10, 100, 1006, 'active'),
(10062, 'Mfou',         'quartier', 1006, 1, 10, 100, 1006, 'active');

-- Douala 1er
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10100, 'Bonanjo',      'quartier', 1010, 1, 11, 110, 1010, 'active'),
(10101, 'Akwa',         'quartier', 1010, 1, 11, 110, 1010, 'active'),
(10102, 'Bali',         'quartier', 1010, 1, 11, 110, 1010, 'active'),
(10103, 'Bonapriso',    'quartier', 1010, 1, 11, 110, 1010, 'active'),
(10104, 'Bonamoussadi', 'quartier', 1010, 1, 11, 110, 1010, 'active');

-- Douala 2ème
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10110, 'New Bell',     'quartier', 1011, 1, 11, 110, 1011, 'active'),
(10111, 'Bepanda',      'quartier', 1011, 1, 11, 110, 1011, 'active'),
(10112, 'Deido',        'quartier', 1011, 1, 11, 110, 1011, 'active'),
(10113, 'Ndog-Bong',    'quartier', 1011, 1, 11, 110, 1011, 'active');

-- Douala 3ème
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10120, 'Logbessou',    'quartier', 1012, 1, 11, 110, 1012, 'active'),
(10121, 'Makepe',       'quartier', 1012, 1, 11, 110, 1012, 'active'),
(10122, 'PK8',          'quartier', 1012, 1, 11, 110, 1012, 'active'),
(10123, 'Ndokotti',     'quartier', 1012, 1, 11, 110, 1012, 'active');

-- Douala 4ème
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10130, 'Bonaberi',     'quartier', 1013, 1, 11, 110, 1013, 'active'),
(10131, 'Ndokoti',      'quartier', 1013, 1, 11, 110, 1013, 'active'),
(10132, 'Ndobo',        'quartier', 1013, 1, 11, 110, 1013, 'active');

-- Douala 5ème
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10140, 'Kotto',        'quartier', 1014, 1, 11, 110, 1014, 'active'),
(10141, 'Nyalla',       'quartier', 1014, 1, 11, 110, 1014, 'active'),
(10142, 'Ndogbong',     'quartier', 1014, 1, 11, 110, 1014, 'active');

-- Bafoussam 1er
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10200, 'Bafoussam Centre',  'quartier', 1020, 1, 12, 120, 1020, 'active'),
(10201, 'Djeleng',           'quartier', 1020, 1, 12, 120, 1020, 'active'),
(10202, 'Tamdja',            'quartier', 1020, 1, 12, 120, 1020, 'active');

-- Bamenda 1er
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10300, 'Commercial Avenue',   'quartier', 1030, 1, 14, 140, 1030, 'active'),
(10301, 'Up Station',          'quartier', 1030, 1, 14, 140, 1030, 'active'),
(10302, 'Ntarikon',            'quartier', 1030, 1, 14, 140, 1030, 'active');

-- Buea
INSERT INTO geo_locations (id, name, type, parent_id, country_id, region_id, department_id, arrondissement_id, status) VALUES
(10400, 'Buea Town',          'quartier', 1040, 1, 13, 130, 1040, 'active'),
(10401, 'Molyko',             'quartier', 1040, 1, 13, 130, 1040, 'active'),
(10402, 'Bokwango',           'quartier', 1040, 1, 13, 130, 1040, 'active'),
(10403, 'Great Soppo',        'quartier', 1040, 1, 13, 130, 1040, 'active');
