import { Vec, vec } from "@grinstead/ambush";

const SCRATCH_MATRIX = new Float32Array(16);
const SCRATCH_RESULT = new Float32Array(16);

// prettier-ignore
export const IDENTITY = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]);

export class MatrixBinary {
  columnMajor: Float32Array;
  copyOnWrite: boolean = false;

  constructor(copyFrom: Float32Array = IDENTITY) {
    this.columnMajor = new Float32Array(copyFrom);
  }

  setColumn(column: number, data: Array<number>) {
    this.columnMajor.set(data, column * 4);
  }

  set(data: Float32Array) {
    claimMatrix(this);
    this.columnMajor.set(data);
  }

  leftMultiply(other: Float32Array) {
    const colMajor = claimMatrix(this);
    mult(other, colMajor);
    colMajor.set(SCRATCH_RESULT);
  }

  multVec(p: Vec) {
    const mat = this.columnMajor;
    const { x, y, z } = p;

    return vec(
      x * mat[0] + y * mat[4] + z * mat[8],
      x * mat[1] + y * mat[5] + z * mat[9],
      x * mat[2] + y * mat[6] + z * mat[10]
    );
  }

  snapshot() {
    this.copyOnWrite = true;
    return this.columnMajor;
  }
}

function claimMatrix(matrix: MatrixBinary) {
  let { columnMajor } = matrix;

  if (matrix.copyOnWrite) {
    matrix.copyOnWrite = false;
    matrix.columnMajor = columnMajor = new Float32Array(columnMajor);
  }

  return columnMajor;
}

export function translate(
  binary: MatrixBinary,
  x: number,
  y: number,
  z: number
) {
  SCRATCH_MATRIX.fill(0);
  SCRATCH_MATRIX[0] = 1;
  SCRATCH_MATRIX[5] = 1;
  SCRATCH_MATRIX[10] = 1;
  SCRATCH_MATRIX[12] = x;
  SCRATCH_MATRIX[13] = y;
  SCRATCH_MATRIX[14] = z;
  SCRATCH_MATRIX[15] = 1;

  multScratchInto(binary);
}

export function scaleAxes(
  binary: MatrixBinary,
  x: number,
  y: number,
  z: number
) {
  SCRATCH_MATRIX.fill(0);
  SCRATCH_MATRIX[0] = x;
  SCRATCH_MATRIX[5] = y;
  SCRATCH_MATRIX[10] = z;
  SCRATCH_MATRIX[15] = 1;

  multScratchInto(binary);
}

export function rotateAboutX(binary: MatrixBinary, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  SCRATCH_MATRIX.fill(0);
  SCRATCH_MATRIX[0] = 1;
  SCRATCH_MATRIX[5] = cos;
  SCRATCH_MATRIX[6] = sin;
  SCRATCH_MATRIX[9] = -sin;
  SCRATCH_MATRIX[10] = cos;
  SCRATCH_MATRIX[15] = 1;

  multScratchInto(binary);
}

export function rotateAboutY(binary: MatrixBinary, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  SCRATCH_MATRIX.fill(0);
  SCRATCH_MATRIX[0] = cos;
  SCRATCH_MATRIX[2] = -sin;
  SCRATCH_MATRIX[5] = 1;
  SCRATCH_MATRIX[8] = sin;
  SCRATCH_MATRIX[10] = cos;
  SCRATCH_MATRIX[15] = 1;

  multScratchInto(binary);
}

export function rotateAboutZ(binary: MatrixBinary, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  SCRATCH_MATRIX.fill(0);
  SCRATCH_MATRIX[0] = cos;
  SCRATCH_MATRIX[1] = sin;
  SCRATCH_MATRIX[4] = -sin;
  SCRATCH_MATRIX[5] = cos;
  SCRATCH_MATRIX[10] = 1;
  SCRATCH_MATRIX[15] = 1;

  multScratchInto(binary);
}

function multScratchInto(binary: MatrixBinary) {
  const matrix = claimMatrix(binary);
  mult(SCRATCH_MATRIX, matrix);
  matrix.set(SCRATCH_RESULT);
}

function mult(a: Float32Array, b: Float32Array) {
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      SCRATCH_RESULT[index(row, col)] =
        a[index(row, 0)] * b[index(0, col)] +
        a[index(row, 1)] * b[index(1, col)] +
        a[index(row, 2)] * b[index(2, col)] +
        a[index(row, 3)] * b[index(3, col)];
    }
  }
}

function index(row: number, col: number) {
  return 4 * col + row;
}
