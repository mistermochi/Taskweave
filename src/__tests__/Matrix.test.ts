import { Matrix } from '../shared/lib/math';

describe('Matrix Utility', () => {
  describe('vectorDot', () => {
    it('should calculate the dot product of two vectors', () => {
      expect(Matrix.vectorDot([1, 2, 3], [4, 5, 6])).toBe(32); // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    });
  });

  describe('addOuterProductInPlace', () => {
    it('should add the outer product of a vector to a matrix in-place', () => {
      const A = [
        [1, 0],
        [0, 1]
      ];
      const x = [1, 2];
      // x * x^T = [[1, 2], [2, 4]]
      // A + x * x^T = [[2, 2], [2, 5]]
      Matrix.addOuterProductInPlace(A, x);
      expect(A).toEqual([
        [2, 2],
        [2, 5]
      ]);
    });
  });

  describe('addScaledVectorInPlace', () => {
    it('should add a scaled vector to another vector in-place', () => {
      const a = [1, 2];
      const x = [3, 4];
      const s = 2;
      // a + s * x = [1 + 6, 2 + 8] = [7, 10]
      Matrix.addScaledVectorInPlace(a, x, s);
      expect(a).toEqual([7, 10]);
    });
  });

  describe('invert', () => {
    it('should invert a 2x2 matrix', () => {
      const A = [
        [4, 7],
        [2, 6]
      ];
      // det = 4*6 - 7*2 = 24 - 14 = 10
      // A^-1 = 1/10 * [[6, -7], [-2, 4]] = [[0.6, -0.7], [-0.2, 0.4]]
      const inv = Matrix.invert(A);
      expect(inv[0][0]).toBeCloseTo(0.6);
      expect(inv[0][1]).toBeCloseTo(-0.7);
      expect(inv[1][0]).toBeCloseTo(-0.2);
      expect(inv[1][1]).toBeCloseTo(0.4);
    });

    it('should throw for singular matrix', () => {
      const A = [
        [1, 1],
        [1, 1]
      ];
      expect(() => Matrix.invert(A)).toThrow('Matrix is singular');
    });

    it('should invert an identity matrix to itself', () => {
        const I = Matrix.identity(3);
        const inv = Matrix.invert(I);
        expect(inv).toEqual(I);
    });
  });
});
