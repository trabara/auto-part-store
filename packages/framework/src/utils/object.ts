export function omitNil<T extends object>(obj: T) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (typeof value === "object" && value !== null) {
      acc[key as keyof T] = omitNil(value)
    }

    if (value !== null && value !== undefined) {
      acc[key as keyof T] = value
    }
    return acc
  }, {} as T)
}
