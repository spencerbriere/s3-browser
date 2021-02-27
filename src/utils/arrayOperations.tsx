export function symetricDifference<Type>(arrA: Type[], arrB: Type[]): Type[] {
  return arrA
    .filter((x) => !arrB.includes(x))
    .concat(arrB.filter((x) => !arrA.includes(x)));
}

export function intersection<Type>(arrA: Type[], arrB: Type[]): Type[] {
  return arrA.filter((x) => arrB.includes(x));
}

export function union<Type>(arrA: Type[], arrB: Type[]): Type[] {
  return [...new Set([...arrA, ...arrB])];
}

export function difference<Type>(arrA: Type[], arrB: Type[]): Type[] {
  return arrA.filter((x) => !arrB.includes(x));
}
