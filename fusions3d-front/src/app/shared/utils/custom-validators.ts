import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Valida que el valor sea una URL http(s) válida.
 * Los campos vacíos se consideran válidos (combinar con Validators.required si procede).
 */
export function urlValidator(): ValidatorFn {
  const urlPattern = /^https?:\/\/[\w-]+(\.[\w-]+)+(:\d{1,5})?(\/\S*)?$/;
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return urlPattern.test(String(control.value).trim()) ? null : { url: true };
  };
}

/**
 * Valida que el valor sea numérico y estrictamente positivo (> 0).
 */
export function positiveNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') return null;
    const value = Number(control.value);
    if (Number.isNaN(value)) return { notANumber: true };
    return value > 0 ? null : { notPositive: true };
  };
}

/**
 * Devuelve el primer mensaje de error accesible para un control,
 * listo para mostrar en la interfaz.
 */
export function getControlErrorMessage(control: AbstractControl | null, label: string): string | null {
  if (!control || !control.errors || !(control.dirty || control.touched)) return null;

  const errors = control.errors;
  if (errors['required']) return `${label} es obligatorio.`;
  if (errors['minlength']) return `${label} debe tener al menos ${errors['minlength'].requiredLength} caracteres.`;
  if (errors['maxlength']) return `${label} no puede superar los ${errors['maxlength'].requiredLength} caracteres.`;
  if (errors['min']) return `${label} no puede ser inferior a ${errors['min'].min}.`;
  if (errors['notANumber']) return `${label} debe ser un valor numérico.`;
  if (errors['notPositive']) return `${label} debe ser un precio/valor positivo.`;
  if (errors['url']) return `${label} debe ser una URL válida (http:// o https://).`;
  if (errors['pattern']) return `${label} no tiene un formato válido.`;

  return `${label} no es válido.`;
}
