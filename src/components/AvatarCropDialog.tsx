import { lazy, Suspense, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut } from "lucide-react";

const LazyCropper = lazy(() => import("react-easy-crop"));

interface AvatarCropDialogProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No se pudo crear el contexto del canvas");
  }

  // Establecer dimensiones del canvas
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Dibujar la imagen recortada
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  // Convertir a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Error al crear el blob de la imagen"));
        }
      },
      "image/jpeg",
      0.95,
    );
  });
}

const AvatarCropDialog = ({
  open,
  imageSrc,
  onClose,
  onCropComplete,
}: AvatarCropDialogProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropChange = (newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      setLoading(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error("Error al recortar la imagen:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Ajustar foto de perfil
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6">
          {/* Crop Area */}
          <div className="relative w-full h-[300px] sm:h-[400px] bg-muted rounded-lg overflow-hidden">
            <Suspense fallback={<div>Cargando editor de imagen...</div>}>
              <LazyCropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropCompleteCallback}
              />
            </Suspense>
          </div>

          {/* Zoom Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
                Zoom
              </span>
              <span className="flex items-center gap-1">
                <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
              </span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(values) => setZoom(values[0] ?? 1)}
              className="w-full"
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Arrastra para mover la imagen y usa el control deslizante para hacer
            zoom
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Procesando...
              </>
            ) : (
              "Guardar foto"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropDialog;
