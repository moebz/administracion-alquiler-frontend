// Espeja la regla real del backend (App\Providers\AppServiceProvider::boot,
// Password::min(8)->letters()->mixedCase()->numbers()->symbols()) para poder
// mostrar en vivo qué falta mientras se escribe, no solo un error genérico
// después de fallar el submit. Los regex de mayúscula/minúscula/número/
// símbolo son los mismos (con las mismas clases Unicode) que usa
// Illuminate\Validation\Rules\Password por dentro — ver
// vendor/laravel/framework/.../Validation/Rules/Password.php.
export type PasswordRequirement = {
  key: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { key: "length", label: "Al menos 8 caracteres", test: (password) => password.length >= 8 },
  { key: "uppercase", label: "Al menos una mayúscula", test: (password) => /\p{Lu}/u.test(password) },
  { key: "lowercase", label: "Al menos una minúscula", test: (password) => /\p{Ll}/u.test(password) },
  { key: "number", label: "Al menos un número", test: (password) => /\p{N}/u.test(password) },
  { key: "symbol", label: "Al menos un símbolo", test: (password) => /[\p{Z}\p{S}\p{P}]/u.test(password) },
];

export const passwordMeetsComplexity = (password: string): boolean =>
  PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password));
