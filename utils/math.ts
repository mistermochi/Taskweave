
export class Matrix {
  // Multiply Matrix x Vector
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

  // Vector Dot Product
  static vectorDot(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  // Matrix Addition
  static add(A: number[][], B: number[][]): number[][] {
    return A.map((row, i) => row.map((val, j) => val + B[i][j]));
  }

  // Outer Product (x * x^T)
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

  // Multiply Vector by Scalar
  static scale(x: number[], s: number): number[] {
    return x.map(val => val * s);
  }

  // Add Vectors
  static vecAdd(a: number[], b: number[]): number[] {
    return a.map((val, i) => val + b[i]);
  }

  // Identity Matrix
  static identity(n: number): number[][] {
    const res = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) res[i][i] = 1;
    return res;
  }

  // Matrix Inversion (Gaussian Elimination)
  // Suitable for small d (d=11)
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
      if (Math.abs(div) < 1e-10) throw new Error("Matrix is singular"); // Should not happen with Ridge Regression (alpha > 0)

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
