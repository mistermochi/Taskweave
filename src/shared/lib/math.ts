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
   * Bolt ⚡ Optimization: Use standard for loop instead of reduce for hot path performance.
   * @param a - First vector.
   * @param b - Second vector.
   * @returns The scalar dot product.
   */
  static vectorDot(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
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
   * Performs in-place addition of outer product (A = A + x * x^T).
   * Bolt ⚡ Optimization: Eliminates O(d^2) allocations per sample during model updates.
   * @param A - Target matrix to update in-place.
   * @param x - Vector to compute outer product from.
   */
  static addOuterProductInPlace(A: number[][], x: number[]): void {
    const n = x.length;
    for (let i = 0; i < n; i++) {
      const xi = x[i];
      if (xi === 0) continue;
      for (let j = 0; j < n; j++) {
        A[i][j] += xi * x[j];
      }
    }
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
   * Performs in-place addition of scaled vector (a = a + s * x).
   * Bolt ⚡ Optimization: Eliminates O(d) allocations per sample during model updates.
   * @param a - Target vector to update in-place.
   * @param x - Vector to scale and add.
   * @param s - Scalar multiplier.
   */
  static addScaledVectorInPlace(a: number[], x: number[], s: number): void {
    for (let i = 0; i < a.length; i++) {
      a[i] += s * x[i];
    }
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
    // Bolt ⚡ Optimization: Construct augmented matrix [A | I] directly
    // to avoid O(n^2) allocations for a separate identity matrix.
    const aug = new Array(n);
    for (let i = 0; i < n; i++) {
      const row = new Array(2 * n).fill(0);
      for (let j = 0; j < n; j++) {
        row[j] = A[i][j];
      }
      row[n + i] = 1;
      aug[i] = row;
    }

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
