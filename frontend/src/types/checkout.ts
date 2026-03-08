/**
 * Типы для формы оформления заказа.
 */

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  zip: string;
  address: string;
  privacyAccepted: boolean;
}

export type CheckoutStep = "contacts" | "delivery" | "payment";
export type DeliveryMethod = "cdek" | "vk" | null;

export const EMPTY_CHECKOUT_FORM: CheckoutFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  zip: "",
  address: "",
  privacyAccepted: false,
};

/**
 * Провайдер ЮKassa — identifier как задан в static identifier класса.
 * Medusa v2 использует identifier напрямую при инициализации payment session.
 */
export const YUKASSA_PROVIDER_ID = "yukassa";
