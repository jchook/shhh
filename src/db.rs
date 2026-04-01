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

#[cfg(test)]
mod tests {
    use super::*;

    fn approx_eq(a: f32, b: f32, epsilon: f32) -> bool {
        (a - b).abs() < epsilon
    }

    #[test]
    fn silence() {
        let samples = vec![0.0_f32; 1024];
        let (rms, peak, hybrid, db) = compute_loudness(&samples, 0.5);
        assert_eq!(rms, 0.0);
        assert_eq!(peak, 0.0);
        assert_eq!(hybrid, 0.0);
        // dB of silence floors at 1e-10 → -200 dB
        assert!(db < -190.0);
    }

    #[test]
    fn full_scale() {
        let samples = vec![1.0_f32; 1024];
        let (rms, peak, _hybrid, db) = compute_loudness(&samples, 0.5);
        assert!(approx_eq(rms, 1.0, 1e-6));
        assert!(approx_eq(peak, 1.0, 1e-6));
        assert!(approx_eq(db, 0.0, 1e-4));
    }

    #[test]
    fn constant_half() {
        let samples = vec![0.5_f32; 1024];
        let (rms, peak, _hybrid, db) = compute_loudness(&samples, 0.5);
        assert!(approx_eq(rms, 0.5, 1e-6));
        assert!(approx_eq(peak, 0.5, 1e-6));
        // 20 * log10(0.5) ≈ -6.02 dB
        assert!(approx_eq(db, -6.0206, 0.01));
    }

    #[test]
    fn sensitivity_zero_uses_rms() {
        let samples = vec![0.0, 0.0, 0.0, 1.0]; // rms=0.5, peak=1.0
        let (_rms, _peak, hybrid, _db) = compute_loudness(&samples, 0.0);
        let expected_rms = (1.0_f32 / 4.0).sqrt(); // 0.5
        assert!(approx_eq(hybrid, expected_rms, 1e-6));
    }

    #[test]
    fn sensitivity_one_uses_peak() {
        let samples = vec![0.0, 0.0, 0.0, 1.0]; // rms=0.5, peak=1.0
        let (_rms, _peak, hybrid, _db) = compute_loudness(&samples, 1.0);
        assert!(approx_eq(hybrid, 1.0, 1e-6));
    }

    #[test]
    fn single_spike() {
        let mut samples = vec![0.0_f32; 1000];
        samples[500] = 0.8;
        let (rms, peak, _hybrid, _db) = compute_loudness(&samples, 0.5);
        assert!(approx_eq(peak, 0.8, 1e-6));
        assert!(rms < peak); // RMS much smaller than peak for a single spike
    }
}