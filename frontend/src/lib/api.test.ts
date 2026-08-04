import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { getErrorMessage } from '@/lib/api'

function axiosErrorWithBody(data: unknown, status = 422): AxiosError {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    data,
    status,
    statusText: 'Unprocessable Content',
    headers: {},
    config: { headers: new AxiosHeaders() },
  })
}

describe('getErrorMessage', () => {
  it('prefers field-level errors over the generic detail', () => {
    const error = axiosErrorWithBody({
      detail: 'Validation failed',
      errors: ['name: must not be blank', 'email: must be a valid address'],
    })
    expect(getErrorMessage(error)).toBe('name: must not be blank, email: must be a valid address')
  })

  it('falls back to detail when there are no field errors', () => {
    const error = axiosErrorWithBody({ detail: 'User 5 is not a member of group 2' })
    expect(getErrorMessage(error)).toBe('User 5 is not a member of group 2')
  })

  it('falls back to a generic message for a non-ProblemDetail axios error', () => {
    const error = axiosErrorWithBody({})
    expect(getErrorMessage(error)).toBe('Something went wrong. Please try again.')
  })

  it('falls back to a generic message for a non-axios error', () => {
    expect(getErrorMessage(new Error('network down'))).toBe('Something went wrong. Please try again.')
    expect(getErrorMessage('a plain string')).toBe('Something went wrong. Please try again.')
  })
})
