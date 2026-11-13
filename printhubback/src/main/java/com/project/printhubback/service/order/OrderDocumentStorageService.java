package com.project.printhubback.service.order;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.util.UUID;

@Service
public class OrderDocumentStorageService {

    private static final long MAX_FILE_SIZE =
            20L * 1024 * 1024;

    private static final int MAX_PAGES = 500;

    private final Path uploadDirectory;

    public OrderDocumentStorageService(
            @Value("${app.upload.order-directory:/app/uploads/orders}")
            String uploadDirectory
    ) {

        this.uploadDirectory = Paths.get(uploadDirectory)
                .toAbsolutePath()
                .normalize();
    }

    public StoredPdf savePdf(MultipartFile file) {

        validateFile(file);

        String originalName = getSafeOriginalFilename(
                file.getOriginalFilename()
        );

        String storedName = UUID.randomUUID() + ".pdf";

        Path targetPath = uploadDirectory
                .resolve(storedName)
                .normalize();

        if (!targetPath.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException(
                    "Invalid document path"
            );
        }

        try {

            Files.createDirectories(uploadDirectory);

            // Save using the generated filename
            Files.copy(
                    file.getInputStream(),
                    targetPath
            );

            int pageCount = extractPageCount(targetPath);

            return new StoredPdf(
                    storedName,
                    originalName,
                    pageCount
            );

        } catch (Exception e) {

            try {
                Files.deleteIfExists(targetPath);
            } catch (IOException ignored) {
            }

            if (e instanceof IllegalArgumentException) {
                throw (IllegalArgumentException) e;
            }

            throw new IllegalArgumentException(
                    "Unable to process PDF. Please upload a valid, unprotected PDF."
            );
        }
    }

    private void validateFile(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Please upload a PDF document"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "PDF size must not exceed 20 MB"
            );
        }

        String originalName = file.getOriginalFilename();

        if (originalName == null ||
                !originalName.toLowerCase().endsWith(".pdf")) {

            throw new IllegalArgumentException(
                    "Only PDF documents are supported"
            );
        }

        // Verify the actual PDF signature.
        try (InputStream input = file.getInputStream()) {

            byte[] signature = input.readNBytes(5);

            if (!"%PDF-".equals(new String(signature))) {
                throw new IllegalArgumentException(
                        "The uploaded file is not a valid PDF"
                );
            }

        } catch (IOException e) {

            throw new IllegalArgumentException(
                    "Unable to read the uploaded document"
            );
        }
    }

    private int extractPageCount(Path path) throws IOException {

        try (PDDocument document = Loader.loadPDF(path.toFile())) {

            if (document.isEncrypted()) {
                throw new IllegalArgumentException(
                        "Password-protected PDFs are not supported"
                );
            }

            int pages = document.getNumberOfPages();

            if (pages <= 0) {
                throw new IllegalArgumentException(
                        "PDF must contain at least one page"
                );
            }

            if (pages > MAX_PAGES) {
                throw new IllegalArgumentException(
                        "PDF cannot contain more than 500 pages"
                );
            }

            return pages;
        }
    }

    private String getSafeOriginalFilename(String filename) {

        if (filename == null || filename.isBlank()) {
            return "document.pdf";
        }

        // Remove any client-supplied directory path.
        String safeName = filename.replace("\\", "/");

        safeName = safeName.substring(
                safeName.lastIndexOf('/') + 1
        );

        if (safeName.length() > 255) {
            safeName = safeName.substring(
                    safeName.length() - 255
            );
        }

        return safeName;
    }

    public Path getDocumentPath(String storedName) {

        Path path = uploadDirectory
                .resolve(storedName)
                .normalize();

        if (!path.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException(
                    "Invalid document path"
            );
        }

        return path;
    }

    public void deleteDocument(String storedName) {

        if (storedName == null) {
            return;
        }

        try {

            Files.deleteIfExists(
                    getDocumentPath(storedName)
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Unable to delete document",
                    e
            );
        }
    }

    public record StoredPdf(
            String storedFileName,
            String originalFileName,
            int pageCount
    ) {
    }
}