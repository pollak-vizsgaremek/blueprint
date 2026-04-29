-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 130.61.78.66:5432
-- Generation Time: Apr 29, 2026 at 11:22 PM
-- Server version: 11.8.5-MariaDB-ubu2404
-- PHP Version: 8.4.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `blueprint`
--
CREATE DATABASE IF NOT EXISTS `blueprint` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
USE `blueprint`;

-- --------------------------------------------------------

--
-- Table structure for table `event`
--

CREATE TABLE `event` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `imageUrl` text DEFAULT NULL,
  `creator` varchar(191) NOT NULL,
  `location` varchar(191) NOT NULL,
  `classroom` varchar(191) NOT NULL DEFAULT 'Ismeretlen',
  `date` datetime(3) NOT NULL,
  `maxParticipants` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `updatedBy` int(11) DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event`
--

INSERT INTO `event` (`id`, `name`, `description`, `imageUrl`, `creator`, `location`, `classroom`, `date`, `maxParticipants`, `createdAt`, `updatedAt`, `updatedBy`, `createdBy`, `deletedAt`) VALUES
(1, 'Pollák nyílt kapuk', 'Tekints be te is a Pollákba', 'https://blueprint-s3.gemes.eu/blueprint/events/event-98e144ac-eeb7-430b-9054-a754811a7186.jpg', 'Kovács Atilla', 'Hódmezővásárhelyi SZC Szentesi Pollák Antal Technikum', 'Torna T.', '2027-01-13 10:00:00.000', 120, '2026-04-29 20:14:34.182', '2026-04-29 20:27:19.392', 1, 1, NULL),
(2, 'Új Esport terem megnyitó', 'Próbáld ki te is', 'https://blueprint-s3.gemes.eu/blueprint/events/event-6801dfe0-30c5-445e-bd54-932fee8025c4.jpg', 'Feke András', 'Hódmezővásárhelyi SZC Szentesi Pollák Antal Technikum', 'Torna T.', '2026-05-04 06:00:00.000', 11, '2026-04-29 20:31:44.627', '2026-04-29 20:31:44.627', 1, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `eventComment`
--

CREATE TABLE `eventComment` (
  `id` int(11) NOT NULL,
  `eventId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `content` text NOT NULL,
  `isVerified` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `eventComment`
--

INSERT INTO `eventComment` (`id`, `eventId`, `userId`, `content`, `isVerified`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 1, 'Biztos hogy ott leszek!', 1, '2026-04-29 20:29:15.717', '2026-04-29 20:29:15.717', NULL),
(2, 2, 1, 'Ez szerintem nagyon jó', 1, '2026-04-29 21:09:37.982', '2026-04-29 21:09:37.982', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `eventNews`
--

CREATE TABLE `eventNews` (
  `id` int(11) NOT NULL,
  `eventId` int(11) NOT NULL,
  `authorId` int(11) NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `imageUrl` text DEFAULT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 0,
  `publishedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `news`
--

CREATE TABLE `news` (
  `id` int(11) NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `imageUrl` text DEFAULT NULL,
  `authorId` int(11) NOT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 0,
  `publishedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `url` varchar(191) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'info',
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification`
--

INSERT INTO `notification` (`id`, `userId`, `url`, `title`, `message`, `type`, `isRead`, `createdAt`) VALUES
(1, 1, '/events/1/details', 'Sikeres esemény jelentkezés', 'Sikeresen jelentkeztél: Pollák nyílt kapuk', 'success', 0, '2026-04-29 20:42:24.236');

-- --------------------------------------------------------

--
-- Table structure for table `registration`
--

CREATE TABLE `registration` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `eventId` int(11) NOT NULL,
  `registeredAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `status` varchar(191) NOT NULL DEFAULT 'registered'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `registration`
--

INSERT INTO `registration` (`id`, `userId`, `eventId`, `registeredAt`, `status`) VALUES
(1, 1, 1, '2026-04-29 20:42:24.225', 'registered');

-- --------------------------------------------------------

--
-- Table structure for table `teacherAvailability`
--

CREATE TABLE `teacherAvailability` (
  `id` int(11) NOT NULL,
  `teacherId` int(11) NOT NULL,
  `dayOfWeek` int(11) NOT NULL,
  `startMinutes` int(11) NOT NULL,
  `endMinutes` int(11) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teacherReservation`
--

CREATE TABLE `teacherReservation` (
  `id` int(11) NOT NULL,
  `teacherId` int(11) NOT NULL,
  `studentId` int(11) NOT NULL,
  `classroom` varchar(191) DEFAULT NULL,
  `startTime` datetime(3) NOT NULL,
  `endTime` datetime(3) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'pending',
  `purpose` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `classroom` varchar(191) DEFAULT NULL,
  `emailVerified` tinyint(1) NOT NULL DEFAULT 0,
  `password` varchar(191) NOT NULL,
  `dateOfBirth` date NOT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'user',
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `settingJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settingJson`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `email`, `classroom`, `emailVerified`, `password`, `dateOfBirth`, `role`, `status`, `settingJson`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Gémes Gergő', 'gemes.gergo2007@gmail.com', NULL, 1, '$2b$10$CwXUIINbhuNYW0KOTrm3XeeDOgfAB.aD9apVFEb.2CvI90Qf3K2aC', '2007-01-25', 'admin', 'active', '{\"inAppReminders\":true,\"eventUpdates\":true,\"appointmentUpdates\":true,\"marketingNews\":false,\"showPastEvents\":true,\"autoOpenEventModal\":true,\"compactCalendar\":false,\"reducedMotion\":false,\"highContrast\":false,\"weekStart\":\"monday\",\"showWeekNumbers\":false,\"defaultCalendarView\":\"month\",\"hideCancelledAppointments\":true}', '2026-04-29 20:11:05.264', '2026-04-29 20:56:06.802', NULL),
(4, 'Gombár Martin', 'gombarmartin2006@gmail.com', NULL, 0, '$2b$10$eJ.yMckf8FGqSNOUCeQRYuJOxE5IkRM6RgMzpn5k4b4qLlRL5ovk6', '2006-05-30', 'teacher', 'active', '{}', '2026-04-29 20:38:32.109', '2026-04-29 20:38:32.109', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `event`
--
ALTER TABLE `event`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_createdBy_deletedAt_idx` (`createdBy`,`deletedAt`),
  ADD KEY `event_updatedBy_fkey` (`updatedBy`);

--
-- Indexes for table `eventComment`
--
ALTER TABLE `eventComment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eventComment_eventId_createdAt_idx` (`eventId`,`createdAt`),
  ADD KEY `eventComment_userId_idx` (`userId`);

--
-- Indexes for table `eventNews`
--
ALTER TABLE `eventNews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eventNews_eventId_isPublished_idx` (`eventId`,`isPublished`),
  ADD KEY `eventNews_authorId_idx` (`authorId`);

--
-- Indexes for table `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`),
  ADD KEY `news_isPublished_publishedAt_idx` (`isPublished`,`publishedAt`),
  ADD KEY `news_authorId_idx` (`authorId`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notification_userId_isRead_idx` (`userId`,`isRead`);

--
-- Indexes for table `registration`
--
ALTER TABLE `registration`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `registration_userId_eventId_key` (`userId`,`eventId`),
  ADD KEY `registration_eventId_fkey` (`eventId`);

--
-- Indexes for table `teacherAvailability`
--
ALTER TABLE `teacherAvailability`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teacherAvailability_teacherId_dayOfWeek_startMinutes_endMinu_key` (`teacherId`,`dayOfWeek`,`startMinutes`,`endMinutes`),
  ADD KEY `teacherAvailability_teacherId_dayOfWeek_isActive_idx` (`teacherId`,`dayOfWeek`,`isActive`);

--
-- Indexes for table `teacherReservation`
--
ALTER TABLE `teacherReservation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teacherReservation_teacherId_startTime_key` (`teacherId`,`startTime`),
  ADD KEY `teacherReservation_teacherId_startTime_endTime_idx` (`teacherId`,`startTime`,`endTime`),
  ADD KEY `teacherReservation_studentId_idx` (`studentId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_email_key` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `event`
--
ALTER TABLE `event`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `eventComment`
--
ALTER TABLE `eventComment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `eventNews`
--
ALTER TABLE `eventNews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `news`
--
ALTER TABLE `news`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `registration`
--
ALTER TABLE `registration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `teacherAvailability`
--
ALTER TABLE `teacherAvailability`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teacherReservation`
--
ALTER TABLE `teacherReservation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `event`
--
ALTER TABLE `event`
  ADD CONSTRAINT `event_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `event_updatedBy_fkey` FOREIGN KEY (`updatedBy`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `eventComment`
--
ALTER TABLE `eventComment`
  ADD CONSTRAINT `eventComment_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `eventComment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `eventNews`
--
ALTER TABLE `eventNews`
  ADD CONSTRAINT `eventNews_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `eventNews_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `news`
--
ALTER TABLE `news`
  ADD CONSTRAINT `news_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `registration`
--
ALTER TABLE `registration`
  ADD CONSTRAINT `registration_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `registration_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `teacherAvailability`
--
ALTER TABLE `teacherAvailability`
  ADD CONSTRAINT `teacherAvailability_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `teacherReservation`
--
ALTER TABLE `teacherReservation`
  ADD CONSTRAINT `teacherReservation_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `teacherReservation_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
