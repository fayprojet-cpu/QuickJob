/**
 * Redimensionne/compresse une image côté navigateur avant envoi — évite
 * d'envoyer (et de stocker, et de retélécharger ensuite) une photo de
 * téléphone à pleine résolution (souvent 10-20 Mo) pour un avatar affiché
 * au maximum à 80px. Sans dépendance : juste Canvas, déjà dans tous les
 * navigateurs modernes.
 */
export async function compressImage(file: File, maxDimension = 512, quality = 0.85): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) {
      return file;
    }
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    // Si le navigateur ne supporte pas createImageBitmap/canvas (rare) ou
    // que le fichier n'est pas décodable en image, on envoie l'original tel
    // quel plutôt que de bloquer l'upload.
    return file;
  }
}
