-- CreateTable
CREATE TABLE `eventMap` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `imageUrl` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `eventMap_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `event` ADD COLUMN `eventMapId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `event_eventMapId_idx` ON `event`(`eventMapId`);

-- AddForeignKey
ALTER TABLE `event` ADD CONSTRAINT `event_eventMapId_fkey` FOREIGN KEY (`eventMapId`) REFERENCES `eventMap`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
