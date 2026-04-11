import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { registrationAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ScannerPage = () => {
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanner, setScanner] = useState(null);

    useEffect(() => {
        const scannerConfig = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        const newScanner = new Html5QrcodeScanner("reader", scannerConfig, false);
        setScanner(newScanner);

        newScanner.render(onScanSuccess, onScanFailure);

        return () => {
            newScanner.clear().catch(error => {
                console.error("Failed to clear scanner", error);
            });
        };
    }, []);

    const onScanSuccess = async (decodedText) => {
        if (loading) return;
        
        console.log("Scanned Text:", decodedText);
        
        // Extract registration ID
        // Pattern 1: JSON
        let regId = null;
        try {
            const data = JSON.parse(decodedText);
            regId = data.regId || data.registrationId;
        } catch {
            // Pattern 2: "Reg ID: XYZ"
            const match = decodedText.match(/Reg ID:\s*([A-Z0-9-]+)/i);
            if (match) {
                regId = match[1];
            } else {
                // Pattern 3: Just the ID
                regId = decodedText.trim();
            }
        }

        if (regId) {
            handleMarkAttendance(regId);
        } else {
            toast.error("Invalid QR Code format");
        }
    };

    const onScanFailure = (error) => {
        // Silent failure for continuous scanning
    };

    const handleMarkAttendance = async (regId) => {
        setLoading(true);
        try {
            const res = await registrationAPI.markAttendance(regId);
            toast.success(res.data.message || "Attendance marked successfully!");
            setScanResult({
                id: regId,
                status: 'success',
                message: res.data.message,
                student: res.data.registration?.student?.name
            });
            
            // Stop scanner if successful
            if (scanner) {
                scanner.pause(true);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to mark attendance";
            toast.error(errorMsg);
            setScanResult({
                id: regId,
                status: 'error',
                message: errorMsg
            });
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        if (scanner) {
            scanner.resume();
        }
    };

    return (
        <div className="scanner-container">
            <div className="mobile-top-header">
                <div className="header-left">
                    <FiArrowLeft className="icon-btn" onClick={() => navigate(-1)} />
                    <span className="app-title">QR SCANNER</span>
                </div>
            </div>

            <div className="mobile-view-only" style={{ padding: '0px' }}>
                {!scanResult ? (
                    <>
                        <div className="scanner-instruction">
                            <FiInfo /> Align the QR Code on the ID card within the frame
                        </div>
                        <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
                    </>
                ) : (
                    <div className="scan-result-card" style={{ 
                        background: 'white', 
                        padding: '30px', 
                        borderRadius: '16px', 
                        textAlign: 'center',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}>
                        {scanResult.status === 'success' ? (
                            <div style={{ color: '#10B981' }}>
                                <FiCheckCircle size={64} style={{ marginBottom: '16px' }} />
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>ATTENDANCE MARKED</h2>
                                <p style={{ margin: '10px 0', color: '#4B5563' }}>
                                    Registration ID: <strong>{scanResult.id}</strong>
                                </p>
                                {scanResult.student && (
                                    <p style={{ color: '#1F2937', fontWeight: 600 }}>Student: {scanResult.student}</p>
                                )}
                            </div>
                        ) : (
                            <div style={{ color: '#EF4444' }}>
                                <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>SCAN FAILED</h2>
                                <p style={{ margin: '10px 0', color: '#4B5563' }}>{scanResult.message}</p>
                                <p style={{ fontSize: '0.875rem' }}>ID attempted: {scanResult.id}</p>
                            </div>
                        )}
                        
                        <button 
                            className="btn btn-primary btn-block" 
                            style={{ marginTop: '30px' }}
                            onClick={resetScanner}
                        >
                            Scan Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScannerPage;
