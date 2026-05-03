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
   * Performs an in-place update of A = A + x * x^T.
   * Bolt ⚡ Optimization: Eliminates O(d^2) matrix allocation and nested map calls.
   */
  static addOuterProductInPlace(A: number[][], x: number[]): void {
    const n = x.length;
    for (let i = 0; i < n; i++) {
      const xi = x[i];
      for (let j = 0; j < n; j++) {
        A[i][j] += xi * x[j];
      }
    }
  }

  /**
   * Performs an in-place update of v = v + s * x.
   * Bolt ⚡ Optimization: Eliminates O(d) vector allocation.
   */
  static addScaledVectorInPlace(v: number[], x: number[], s: number): void {
    for (let i = 0; i < v.length; i++) {
      v[i] += s * x[i];
    }
  }

  /**
   * Calculates the quadratic form x^T * A * x.
   * Bolt ⚡ Optimization: Uses symmetry of A and avoids intermediate vector allocations.
   * Complexity: O(d^2).
   */
  static symmetricQuadraticForm(x: number[], A: number[][]): number {
    let res = 0;
    const n = x.length;
    for (let i = 0; i < n; i++) {
      const xi = x[i];
      // Diagonal term
      res += xi * xi * A[i][i];
      // Off-diagonal terms (leverage symmetry: 2 * x_i * x_j * A_ij)
      for (let j = i + 1; j < n; j++) {
        res += 2 * xi * x[j] * A[i][j];
      }
    }
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
    // Bolt ⚡ Optimization: Pre-allocate augmented matrix directly to avoid multiple spreads/maps
    const aug: number[][] = new Array(n);
    for (let i = 0; i < n; i++) {
      const row = new Array(2 * n).fill(0);
      for (let j = 0; j < n; j++) row[j] = A[i][j];
      row[n + i] = 1; // Inline identity matrix creation
      aug[i] = row;
    }

    for (let i = 0; i < n; i++) {
      // Pivot
      let pivot = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(aug[j][i]) > Math.abs(aug[pivot][i])) pivot = j;
      }

      if (pivot !== i) {
        const temp = aug[i];
        aug[i] = aug[pivot];
        aug[pivot] = temp;
      }

      const div = aug[i][i];
      if (Math.abs(div) < 1e-10) throw new Error("Matrix is singular");

      const invDiv = 1.0 / div;
      for (let j = i; j < 2 * n; j++) aug[i][j] *= invDiv;

      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = aug[k][i];
          if (Math.abs(factor) > 1e-12) {
            for (let j = i; j < 2 * n; j++) aug[k][j] -= factor * aug[i][j];
          }
        }
      }
    }

    const res: number[][] = new Array(n);
    for (let i = 0; i < n; i++) {
      res[i] = aug[i].slice(n);
    }
    return res;
  }
}
