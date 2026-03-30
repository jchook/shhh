pub fn compute_loudness(data_window: &[f32], sensitivity: f32) -> (f32, f32, f32, f32) {
    // Calculate RMS (Root Mean Square)
    let rms = (data_window.iter().map(|s| s * s).sum::<f32>() / data_window.len() as f32).sqrt();

    // Calculate Peak amplitude
    let peak = data_window.iter().map(|s| s.abs()).fold(0.0_f32, f32::max);

    // Hybrid metric combining RMS and Peak
    let hybrid_metric = (1.0 - sensitivity) * rms + sensitivity * peak;

    // Convert hybrid metric to dB
    let db = 20.0 * hybrid_metric.max(1e-10).log10();

    (rms, peak, hybrid_metric, db)
}