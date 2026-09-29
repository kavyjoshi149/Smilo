package com.Smilo.SmiloApp.services;

import jakarta.annotation.PostConstruct;
import nu.pattern.OpenCV;
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.opencv.objdetect.CascadeClassifier;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Service
public class SmileDetectionService {

    private CascadeClassifier faceCascade;
    private CascadeClassifier smileCascade;

    @PostConstruct
    public void init() throws IOException {
        OpenCV.loadLocally(); // extracts + loads the native OpenCV lib for this OS automatically

        faceCascade = loadCascade("haarcascades/haarcascade_frontalface_default.xml");
        smileCascade = loadCascade("haarcascades/haarcascade_smile.xml");
    }

    // CascadeClassifier needs a filesystem path, so classpath cascades are
    // copied to temp files ONCE at startup. Unrelated to user photos below,
    // which are never written to disk.
    private CascadeClassifier loadCascade(String classpathResource) throws IOException {
        ClassPathResource resource = new ClassPathResource(classpathResource);
        Path tempFile = Files.createTempFile("cascade", ".xml");
        try (InputStream in = resource.getInputStream()) {
            Files.copy(in, tempFile, StandardCopyOption.REPLACE_EXISTING);
        }
        tempFile.toFile().deleteOnExit();

        CascadeClassifier classifier = new CascadeClassifier(tempFile.toString());
        if (classifier.empty()) {
            throw new IllegalStateException("Failed to load cascade: " + classpathResource);
        }
        return classifier;
    }

    /**
     * Counts smiling faces in an image, entirely in memory.
     * The image bytes are never written to disk.
     */
//    public int countSmilingFaces(byte[] imageBytes) {
//        MatOfByte matOfByte = new MatOfByte(imageBytes);
//        Mat image = Imgcodecs.imdecode(matOfByte, Imgcodecs.IMREAD_COLOR);
//
//        if (image.empty()) {
//            throw new IllegalArgumentException("Uploaded file is not a valid image");
//        }
//
//        Mat gray = new Mat();
//        Imgproc.cvtColor(image, gray, Imgproc.COLOR_BGR2GRAY);
//        Imgproc.equalizeHist(gray, gray);
//
//        MatOfRect faceDetections = new MatOfRect();
//        faceCascade.detectMultiScale(gray, faceDetections);
//
//        Rect[] faces = faceDetections.toArray();
//        int smilingCount = 0;
//
//        for (Rect faceRect : faces) {
//            Mat faceROI = new Mat(gray, faceRect);
//
//            MatOfRect smileDetections = new MatOfRect();
//            smileCascade.detectMultiScale(
//                    faceROI, smileDetections,
//                    1.7, 20, 0,
//                    new Size(25, 25), new Size()
//            );
//
//            if (smileDetections.toArray().length > 0) {
//                smilingCount++;
//            }
//        }
//        System.out.println("smiling faces count :"+smilingCount);
//        return smilingCount;
//    }
//    public int countSmilingFaces(byte[] imageBytes) {
//        MatOfByte matOfByte = new MatOfByte(imageBytes);
//        Mat image = Imgcodecs.imdecode(matOfByte, Imgcodecs.IMREAD_COLOR);
//
//        if (image.empty()) {
//            throw new IllegalArgumentException("Uploaded file is not a valid image");
//        }
//
//        Mat gray = new Mat();
//        Imgproc.cvtColor(image, gray, Imgproc.COLOR_BGR2GRAY);
//        // removed equalizeHist — your working standalone script doesn't use it either
//
//        MatOfRect faceDetections = new MatOfRect();
//        faceCascade.detectMultiScale(gray, faceDetections, 1.1, 5); // explicit params, matching working code
//
//        Rect[] faces = faceDetections.toArray();
//        System.out.println("Faces detected: " + faces.length);
//
//        int smilingCount = 0;
//
//        for (Rect faceRect : faces) {
//            Mat faceROI = gray.submat(faceRect); // matches working code's gray.submat(face)
//
//            MatOfRect smileDetections = new MatOfRect();
//            smileCascade.detectMultiScale(faceROI, smileDetections, 1.7, 20); // no minSize/maxSize, matching working code
//
//            System.out.println("Face " + faceRect + " -> smiles: " + smileDetections.toArray().length);
//
//            if (smileDetections.toArray().length > 0) {
//                smilingCount++;
//            }
//        }
//
//        System.out.println("Total smiling faces: " + smilingCount);
//        return smilingCount;
//    }
    public int countSmilingFaces(byte[] imageBytes) {
        MatOfByte matOfByte = new MatOfByte(imageBytes);
        Mat image = Imgcodecs.imdecode(matOfByte, Imgcodecs.IMREAD_COLOR);

        if (image.empty()) {
            throw new IllegalArgumentException("Uploaded file is not a valid image");
        }

        Mat gray = new Mat();
        Imgproc.cvtColor(image, gray, Imgproc.COLOR_BGR2GRAY);

        MatOfRect faceDetections = new MatOfRect();
        faceCascade.detectMultiScale(gray, faceDetections, 1.1, 5);

        Rect[] faces = faceDetections.toArray();
        System.out.println("=== Image " + image.width() + "x" + image.height() + " — Faces detected: " + faces.length + " ===");

        int smilingCount = 0;

        for (Rect faceRect : faces) {
            // Restrict smile search to the LOWER HALF of the face (mouth region).
            // Searching the whole face is a major cause of missed/false smiles —
            // the classic cascade tutorials do this and it matters a lot.
            Rect lowerHalf = new Rect(
                    faceRect.x,
                    faceRect.y + faceRect.height / 2,
                    faceRect.width,
                    faceRect.height / 2
            );
            Mat mouthROI = gray.submat(lowerHalf);

            MatOfRect smileDetections = new MatOfRect();
            smileCascade.detectMultiScale(
                    mouthROI, smileDetections,
                    1.7, 15,
                    0,
                    new Size(faceRect.width / 3, faceRect.height / 5), // scale minSize to face size
                    new Size()
            );

            int smileCount = smileDetections.toArray().length;
            System.out.println("Face " + faceRect + " (" + faceRect.width + "x" + faceRect.height + ") -> smiles found: " + smileCount);

            if (smileCount > 0) {
                smilingCount+=10;
            }else{
                smilingCount+=2;
            }
        }

        System.out.println("Total smiling faces: " + smilingCount);
        return smilingCount;
    }
}