import { resourceErrorMessage } from '@/utils/resourceErrors';

describe('resourceErrorMessage', () => {
  it('traduce una constraint de Postgres a una frase', () => {
    const raw =
      'new row for relation "resources" violates check constraint "resources_website_url_http"';
    expect(resourceErrorMessage(raw)).toBe(
      'The website needs to be a full address, like https://yourstudio.com.'
    );
  });

  it('distingue la red social de la que habla', () => {
    expect(resourceErrorMessage('violates check constraint "resources_instagram_url_http"')).toContain(
      'Instagram'
    );
    expect(resourceErrorMessage('violates check constraint "resources_facebook_url_http"')).toContain(
      'Facebook'
    );
  });

  it('traduce también el índice único de emails', () => {
    expect(
      resourceErrorMessage('duplicate key value violates unique constraint "resource_emails_email_unique"')
    ).toBe('That email is already on your profile.');
  });

  it('a nuestras propias excepciones solo les quita el prefijo técnico', () => {
    expect(resourceErrorMessage('resources: a fixed scope is exactly one region (got 2)')).toBe(
      'A fixed scope is exactly one region (got 2)'
    );
    expect(resourceErrorMessage('save_resource: that account already has a profile')).toBe(
      'That account already has a profile'
    );
  });

  it('acepta un Error y un objeto con message, no solo texto', () => {
    expect(resourceErrorMessage(new Error('violates check constraint "resources_name_not_blank"'))).toBe(
      'Your profile needs a name.'
    );
    expect(resourceErrorMessage({ message: 'violates check constraint "resources_name_length"' })).toBe(
      'That name is too long.'
    );
  });

  it('un error que no sabemos contar no enseña jerga', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const message = resourceErrorMessage('deadlock detected on relation 12345');

    expect(message).toBe('Something went wrong saving that. Have another go.');
    expect(message).not.toContain('relation');
    expect(warn).toHaveBeenCalled();  // pero nosotros sí lo vemos
    warn.mockRestore();
  });

  it('sin error devuelve algo legible igualmente', () => {
    expect(resourceErrorMessage(undefined)).toBe('Something went wrong saving that. Have another go.');
    expect(resourceErrorMessage('')).toBe('Something went wrong saving that. Have another go.');
  });
});
