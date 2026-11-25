export interface MerchantAccountProps {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  createdAt?: Date;
}

/**
 * Domain Model: MerchantAccount
 * Encapsulates merchant identity and API key credentials
 */
export class MerchantAccount {
  readonly #id: string;
  readonly #name: string;
  readonly #email: string;
  readonly #apiKey: string;
  readonly #createdAt: Date;

  constructor(props: MerchantAccountProps) {
    this.#id = props.id;
    this.#name = props.name.trim();
    this.#email = props.email.toLowerCase().trim();
    this.#apiKey = props.apiKey;
    this.#createdAt = props.createdAt || new Date();
  }

  public get id(): string { return this.#id; }
  public get name(): string { return this.#name; }
  public get email(): string { return this.#email; }
  public get createdAt(): Date { return this.#createdAt; }

  public verifyApiKey(incomingKey: string): boolean {
    return this.#apiKey === incomingKey;
  }

  public toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      email: this.#email,
      createdAt: this.#createdAt.toISOString(),
    };
  }
}

