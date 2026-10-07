import Swal from 'sweetalert2';

/**
 * SweetAlert2 con el tema oscuro de Fusions3D preaplicado
 * (clases definidas en styles.css).
 */
const themedSwal = Swal.mixin({
  customClass: { popup: 'fusions3d-swal' },
});

/** Muestra un mensaje de error. */
export function showError(message: string, title = 'Error'): void {
  void themedSwal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Aceptar',
  });
}

/** Muestra un mensaje de éxito que se cierra solo. */
export function showSuccess(message: string, title = '¡Correcto!'): void {
  void themedSwal.fire({
    icon: 'success',
    title,
    text: message,
    timer: 2200,
    showConfirmButton: false,
  });
}

/** Diálogo de confirmación (acciones destructivas). Devuelve true si se confirma. */
export async function confirmAction(options: {
  title: string;
  text: string;
  confirmText?: string;
}): Promise<boolean> {
  const result = await themedSwal.fire({
    icon: 'warning',
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? 'Confirmar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  });
  return result.isConfirmed;
}
