import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, Volume2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { playScannerBeep } from '../utils/sound';

export default function BarcodeScannerModal({ isOpen, onClose, onScan, title = "Lector de Código por Cámara" }) {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode = null;

    if (isOpen) {
      setError(null);
      setLastScanned(null);
      setIsScanning(true);

      const elementId = "html5-qr-reader-container";
      
      // Delay initialization to ensure DOM element exists
      const timer = setTimeout(() => {
        const readerElem = document.getElementById(elementId);
        if (!readerElem) return;

        html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        // Support standard formats and fallback to any available camera if environment facingMode fails
        const config = {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.8),
              height: Math.floor(minEdge * 0.55)
            };
          },
          aspectRatio: 1.0,
        };

        const handleSuccess = (decodedText) => {
          playScannerBeep();
          setLastScanned(decodedText);
          if (onScan) {
            onScan(decodedText);
          }
          // Auto close after successful scan
          setTimeout(() => {
            if (html5QrCode && html5QrCode.isScanning) {
              html5QrCode.stop().then(() => {
                html5QrCode.clear();
                onClose();
              }).catch(() => onClose());
            } else {
              onClose();
            }
          }, 600);
        };

        // Try environment camera first, then fallback to any available camera
        Html5Qrcode.getCameras().then(devices => {
          if (devices && devices.length) {
            const cameraId = devices.length > 1 
              ? (devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera'))?.id || devices[0].id)
              : devices[0].id;

            html5QrCode.start(
              cameraId,
              config,
              handleSuccess,
              () => {}
            ).catch((startErr) => {
              // Fallback to facingMode constraint
              html5QrCode.start(
                { facingMode: "user" },
                config,
                handleSuccess,
                () => {}
              ).catch((finalErr) => {
                console.error("Error al iniciar cámara scanner:", finalErr);
                setError("No se pudo iniciar la cámara web o del dispositivo. Comprueba que diste permiso de cámara en el navegador.");
                setIsScanning(false);
              });
            });
          } else {
            // No camera device list, try direct environment
            html5QrCode.start(
              { facingMode: "environment" },
              config,
              handleSuccess,
              () => {}
            ).catch(() => {
              html5QrCode.start(
                { facingMode: "user" },
                config,
                handleSuccess,
                () => {}
              ).catch((err) => {
                console.error("Error al iniciar cámara:", err);
                setError("No se detectó cámara disponible o no se otorgaron permisos.");
                setIsScanning(false);
              });
            });
          }
        }).catch(() => {
          // getCameras failed, try direct start
          html5QrCode.start(
            { facingMode: "environment" },
            config,
            handleSuccess,
            () => {}
          ).catch((err) => {
            console.error("Error directo cámara:", err);
            setError("No se pudo acceder a la cámara. Comprueba los permisos en tu navegador.");
            setIsScanning(false);
          });
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              scannerRef.current.stop().then(() => {
                scannerRef.current.clear();
              }).catch(() => {});
            }
          } catch (e) {}
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden relative flex flex-col">
        
        {/* Header */}
        <div className="bg-[#16a085] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight leading-tight">{title}</h3>
              <p className="text-[11px] text-emerald-100 font-medium">Escáner de código de barras 1D / 2D QR</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera Reader Workspace */}
        <div className="p-5 flex flex-col items-center justify-center bg-slate-50 relative min-h-[300px]">
          
          {error ? (
            <div className="flex flex-col items-center justify-center text-center p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 space-y-3">
              <ShieldAlert size={40} className="text-rose-500" />
              <p className="text-xs font-semibold leading-relaxed">{error}</p>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Target Container for Html5Qrcode */}
              <div 
                id="html5-qr-reader-container" 
                className="w-full max-w-[320px] rounded-2xl overflow-hidden border-2 border-dashed border-[#16a085] bg-black shadow-inner relative"
                style={{ minHeight: '220px' }}
              />

              {lastScanned && (
                <div className="mt-4 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 size={16} className="text-[#16a085]" />
                  <span>Código detectado: <strong>{lastScanned}</strong></span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 font-medium mt-4 text-center flex items-center gap-1.5">
                <Volume2 size={14} className="text-[#16a085]" />
                <span>Apunte la cámara al código de barras de la caja de medicina o comprobante.</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Lector USB Hardware y Cámara Activos
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}
