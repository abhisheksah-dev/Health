async function analyzePrescription (imageUrl) {
  // Stub implementation (in a real app, integrate with an OCR service (e.g. Tesseract, Google Vision, etc.))
  console.log("OCR stub: analyzePrescription called for imageUrl:", imageUrl);
  return { confidence: 0.9, medications: [{ name: "StubMed", dosage: "1 mg", frequency: "once a day", duration: "7 days" }] };
}

module.exports = { analyzePrescription };