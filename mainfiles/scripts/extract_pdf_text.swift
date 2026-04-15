import AppKit
import Foundation
import PDFKit
import Vision

func recognizeText(from cgImage: CGImage) -> String {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    do {
        try handler.perform([request])
    } catch {
        return ""
    }

    let observations = request.results ?? []
    let lines = observations.compactMap { $0.topCandidates(1).first?.string }
    return lines.joined(separator: "\n")
}

func cgImage(from image: NSImage) -> CGImage? {
    var proposedRect = CGRect(origin: .zero, size: image.size)
    return image.cgImage(forProposedRect: &proposedRect, context: nil, hints: nil)
}

func ocrText(for page: PDFPage) -> String {
    let bounds = page.bounds(for: .mediaBox)
    let targetSize = NSSize(width: max(bounds.width * 2, 1200), height: max(bounds.height * 2, 1600))
    let image = page.thumbnail(of: targetSize, for: .mediaBox)
    guard let cgImage = cgImage(from: image) else { return "" }
    return recognizeText(from: cgImage)
}

func extractPdfText(from path: String) -> String {
    let url = URL(fileURLWithPath: path)
    guard let document = PDFDocument(url: url) else {
        fputs("Could not open PDF: \(path)\n", stderr)
        exit(1)
    }

    var sections: [String] = []
    for pageIndex in 0..<document.pageCount {
        guard let page = document.page(at: pageIndex) else { continue }
        let directText = page.string?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let pageText = directText.count >= 40 ? directText : ocrText(for: page)
        sections.append("=== PAGE \(pageIndex + 1) ===\n\(pageText)")
    }
    return sections.joined(separator: "\n\n")
}

func extractImageText(from path: String) -> String {
    guard let image = NSImage(contentsOfFile: path), let imageCg = cgImage(from: image) else {
        fputs("Could not open image: \(path)\n", stderr)
        exit(1)
    }
    return recognizeText(from: imageCg)
}

if CommandLine.arguments.count < 2 {
    fputs("Usage: extract_pdf_text.swift <path>\n", stderr)
    exit(1)
}

let path = CommandLine.arguments[1]
let lowercasedPath = path.lowercased()
if lowercasedPath.hasSuffix(".pdf") {
    print(extractPdfText(from: path))
} else {
    print(extractImageText(from: path))
}
