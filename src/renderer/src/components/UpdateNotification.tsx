import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../styles/sweetalert-custom.css';

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseDate?: string;
}

interface DownloadProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export const UpdateNotification: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Listener para cuando hay actualización disponible
    const unsubscribeAvailable = window.electronAPI.onUpdateAvailable((info: UpdateInfo) => {
      console.log('📦 [Update] Actualización disponible:', info);
      
      Swal.fire({
        title: '🎉 Nueva actualización disponible',
        html: `
          <p style="font-size: 16px; margin-bottom: 10px;">
            <strong>Versión ${info.version}</strong>
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            Hay una nueva versión disponible. ¿Deseas descargarla ahora?
          </p>
          ${info.releaseNotes ? `
            <div style="
              margin-top: 15px; 
              padding: 10px; 
              background: #f3f4f6; 
              border-radius: 6px; 
              text-align: left;
              font-size: 13px;
              max-height: 150px;
              overflow-y: auto;
            ">
              ${info.releaseNotes}
            </div>
          ` : ''}
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '📥 Descargar ahora',
        cancelButtonText: 'Más tarde'
      }).then((result) => {
        if (result.isConfirmed) {
          setDownloading(true);
          window.electronAPI.downloadUpdate();
        }
      });
    });

    // Listener para progreso de descarga
    const unsubscribeProgress = window.electronAPI.onDownloadProgress((progressInfo: DownloadProgress) => {
      console.log('📊 [Update] Progreso:', Math.round(progressInfo.percent) + '%');
      setProgress(progressInfo.percent);
    });

    // Listener para cuando la descarga termina
    const unsubscribeDownloaded = window.electronAPI.onUpdateDownloaded((info: UpdateInfo) => {
      console.log('✅ [Update] Actualización descargada:', info);
      setDownloading(false);
      setProgress(0);
      
      Swal.fire({
        title: '✅ Actualización lista',
        html: `
          <p style="font-size: 16px; margin-bottom: 10px;">
            La versión <strong>${info.version}</strong> está lista para instalar
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            La actualización se instalará cuando cierres la aplicación.
          </p>
          <p style="color: #f59e0b; font-size: 13px; margin-top: 15px;">
            También puedes reiniciar ahora para aplicar los cambios.
          </p>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '🔄 Reiniciar ahora',
        cancelButtonText: 'Más tarde'
      }).then((result) => {
        if (result.isConfirmed) {
          window.electronAPI.installUpdate();
        }
      });
    });

    // Listener para errores
    const unsubscribeError = window.electronAPI.onUpdateError((error: string) => {
      console.log('ℹ️ [Update] No se pudo verificar actualizaciones:', error);
      setDownloading(false);
      setProgress(0);
      
      // Toast discreto que se cierra automáticamente (solo si hubo intento de descarga)
      // No mostrar nada si solo falló la verificación automática
      if (downloading) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'No se pudo descargar la actualización',
          text: 'Verifica tu conexión a internet',
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
          background: '#fef3c7',
          iconColor: '#f59e0b',
          customClass: {
            popup: 'colored-toast'
          }
        });
      }
    });

    // Cleanup: remover listeners al desmontar
    return () => {
      unsubscribeAvailable();
      unsubscribeProgress();
      unsubscribeDownloaded();
      unsubscribeError();
    };
  }, []);

  // Mostrar indicador de descarga si está descargando
  if (!downloading) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9999,
      minWidth: '280px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontWeight: '600', color: '#1f2937' }}>
          Descargando actualización...
        </span>
      </div>
      
      <div style={{
        width: '100%',
        height: '8px',
        background: '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '8px'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #10b981, #059669)',
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>
      
      <div style={{
        textAlign: 'center',
        fontSize: '13px',
        color: '#6b7280',
        fontWeight: '500'
      }}>
        {Math.round(progress)}%
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default UpdateNotification;

