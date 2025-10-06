-- Initialize migration tracking table
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `version` VARCHAR(32) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;