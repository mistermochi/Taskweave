/**
 * Math utilities for matrix operations and vector calculations.
 * Primarily used by the Recommendation and Learning engines for
 * linear algebra operations (e.g., LinUCB).
 */

export class Matrix {
  /**
   * Performs Matrix-Vector multiplication.
   * @param A - The matrix (m x n).
   * @param x - The vector (n).
   * @returns The resulting vector (m).
   */
  static dot(A: number[][], x: number[]): number[] {
    const m = A.length;
    const n = A[0].length;
    const res = new Array(m).fill(0);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        res[i] += A[i][j] * x[j];
      }
    }
    return res;
  }

  /**
   * Calculates the dot product of two vectors.
   * @param a - First vector.
   * @param b - Second vector.
   * @returns The scalar dot product.
   */
  static vectorDot(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  /**
   * Performs element-wise matrix addition.
   * @param A - First matrix.
   * @param B - Second matrix.
   * @returns The sum matrix.
   */
  static add(A: number[][], B: number[][]): number[][] {
    return A.map((row, i) => row.map((val, j) => val + B[i][j]));
  }

  /**
   * Calculates the outer product of a vector with itself (x * x^T).
   * @param x - The input vector.
   * @returns The resulting square matrix.
   */
  static outerProduct(x: number[]): number[][] {
    const n = x.length;
    const res = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        res[i][j] = x[i] * x[j];
      }
    }
    return res;
  }

  /**
   * Multiplies a vector by a scalar.
   * @param x - The vector.
   * @param s - The scalar.
   * @returns The scaled vector.
   */
  static scale(x: number[], s: number): number[] {
    return x.map(val => val * s);
  }

  /**
   * Performs element-wise vector addition.
   * @param a - First vector.
   * @param b - Second vector.
   * @returns The sum vector.
   */
  static vecAdd(a: number[], b: number[]): number[] {
    return a.map((val, i) => val + b[i]);
  }

  /**
   * Generates an Identity Matrix of size n.
   * @param n - The dimension of the matrix.
   * @returns An n x n identity matrix.
   */
  static identity(n: number): number[][] {
    const res = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) res[i][i] = 1;
    return res;
  }

  /**
   * Inverts a square matrix using Gaussian Elimination.
   * Note: This implementation is suitable for small dimensions (e.g., d=11).
   *
   * @param A - The matrix to invert.
   * @returns The inverted matrix.
   * @throws Error if the matrix is singular and cannot be inverted.
   */
  static invert(A: number[][]): number[][] {
    const n = A.length;
    // Create augmented matrix [A | I]
    const aug = A.map((row, i) => [...row, ...this.identity(n)[i]]);

    for (let i = 0; i < n; i++) {
      // Pivot
      let pivot = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(aug[j][i]) > Math.abs(aug[pivot][i])) pivot = j;
      }
      [aug[i], aug[pivot]] = [aug[pivot], aug[i]];

      const div = aug[i][i];
      if (Math.abs(div) < 1e-10) throw new Error("Matrix is singular");

      for (let j = 0; j < 2 * n; j++) aug[i][j] /= div;

      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = aug[k][i];
          for (let j = 0; j < 2 * n; j++) aug[k][j] -= factor * aug[i][j];
        }
      }
    }

    return aug.map(row => row.slice(n));
  }
}
