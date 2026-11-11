package com.project.printhubback.service.store;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class StoreImageService {

    private final Path uploadDirectory;

    public StoreImageService(
            @Value("${app.upload.store-directory:/app/uploads/stores}")
            String uploadDirectory
    ) {
        this.uploadDirectory = Paths.get(uploadDirectory)
                .toAbsolutePath()
                .normalize();
    }

    public String saveImage(MultipartFile file) {

        validateImage(file);

        String contentType = file.getContentType();

        String extension;

        if ("image/jpeg".equalsIgnoreCase(contentType)) {
            extension = ".jpg";
        } else if ("image/png".equalsIgnoreCase(contentType)) {
            extension = ".png";
        } else {
            throw new IllegalArgumentException(
                    "Only JPG and PNG images are allowed"
            );
        }

        String fileName = UUID.randomUUID() + extension;

        try {
            Files.createDirectories(uploadDirectory);

            Path targetPath = uploadDirectory.resolve(fileName).normalize();

            if (!targetPath.startsWith(uploadDirectory)) {
                throw new IllegalArgumentException("Invalid file path");
            }

            Files.copy(file.getInputStream(), targetPath);

            return fileName;

        } catch (IOException e) {
            throw new RuntimeException("Unable to save store image", e);
        }
    }

    private void validateImage(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select an image");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "Image size must not exceed 5 MB"
            );
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                !(contentType.equalsIgnoreCase("image/jpeg") ||
                        contentType.equalsIgnoreCase("image/png"))) {

            throw new IllegalArgumentException(
                    "Only JPG and PNG images are allowed"
            );
        }

        // Verify that the uploaded file is actually a readable image.
        try (InputStream inputStream = file.getInputStream()) {

            BufferedImage image = ImageIO.read(inputStream);

            if (image == null) {
                throw new IllegalArgumentException(
                        "Uploaded file is not a valid image"
                );
            }

        } catch (IOException e) {
            throw new IllegalArgumentException(
                    "Unable to read uploaded image"
            );
        }
    }

    public Path getImagePath(String fileName) {

        Path imagePath = uploadDirectory.resolve(fileName)
                .normalize();

        if (!imagePath.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException("Invalid image path");
        }

        return imagePath;
    }

    public void deleteImage(String fileName) {

        if (!StringUtils.hasText(fileName)) {
            return;
        }

        try {
            Files.deleteIfExists(getImagePath(fileName));
        } catch (IOException e) {
            throw new RuntimeException("Unable to delete old store image", e);
        }
    }

}
