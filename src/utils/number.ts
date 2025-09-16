export const formatDecimal = (n: number, digits = 2) => {
  if (n === null || n === undefined) return '';
  return n.toLocaleString('en-US', {
    // minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}


/**
 * Định dạng, làm gọn số thập phân nếu quá dài, chỉ lấy 2 số
 * @param num số đầu vào
 * @returns chuỗi số đã định dạng 
 * @example
    // Test cases
    console.log(formatNumber(2000000.324234));    // "2,000,000.32"
    console.log(formatNumber(-2000000.324234));   // "-2,000,000.32"
    console.log(formatNumber(0.324234));          // "0.32"
    console.log(formatNumber(-0.324234));         // "-0.32"
    console.log(formatNumber(0.00000324234));     // "0.0000032"
    console.log(formatNumber(-0.00000324234));    // "-0.0000032"
    console.log(formatNumber(0));                 // "0"
    console.log(formatNumber(123.456));           // "123.46"
    console.log(formatNumber(0.001));             // "0.0010"
    console.log(formatNumber(-0.000007));         // "-0.0000070"
    console.log(formatNumber(-1230.000007));         // "-1230"
    console.log(formatNumber(1230.000007));         // "1230"
 */
export function formatNumber(num: number): string {
  // Xử lý trường hợp đặc biệt
  if (num === 0) return "0";

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Nếu số lớn hơn hoặc bằng 1
  if (absNum >= 1) {
    const numStr = absNum.toString();
    const [integerPart, decimalPart = ''] = numStr.split('.');

    // Kiểm tra xem có cần hiển thị phần thập phân không
    if (decimalPart) {
      // Tìm 2 chữ số khác 0 đầu tiên trong phần thập phân
      let firstNonZeroIndex = -1;
      for (let i = 0; i < decimalPart.length; i++) {
        if (decimalPart[i] !== '0') {
          firstNonZeroIndex = i;
          break;
        }
      }

      // Nếu không có chữ số khác 0 hoặc chỉ có số 0 ở 2 vị trí đầu
      if (firstNonZeroIndex === -1 || firstNonZeroIndex >= 2) {
        // Chỉ hiển thị phần nguyên
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return isNegative ? `-${formattedInteger}` : formattedInteger;
      } else {
        // Hiển thị với 2 số thập phân
        const formatted = absNum.toFixed(2);
        const [intPart, decPart] = formatted.split('.');
        const formattedInteger = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const result = `${formattedInteger}.${decPart}`;
        return isNegative ? `-${result}` : result;
      }
    } else {
      // Không có phần thập phân
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return isNegative ? `-${formattedInteger}` : formattedInteger;
    }
  }

  // Nếu số nhỏ hơn 1, tìm 2 chữ số khác 0 đầu tiên sau dấu thập phân
  const numStr = absNum.toString();

  // Tách phần thập phân
  const decimalPart = numStr.split('.')[1] || '';

  // Tìm vị trí của chữ số khác 0 đầu tiên
  let firstNonZeroIndex = -1;
  for (let i = 0; i < decimalPart.length; i++) {
    if (decimalPart[i] !== '0') {
      firstNonZeroIndex = i;
      break;
    }
  }

  if (firstNonZeroIndex === -1) {
    return "0";
  }

  // Lấy 2 chữ số từ vị trí đầu tiên khác 0
  const significantDigits = decimalPart.slice(firstNonZeroIndex, firstNonZeroIndex + 2);

  // Xây dựng chuỗi kết quả
  const zeros = '0'.repeat(firstNonZeroIndex);
  const result = `0.${zeros}${significantDigits}`;

  return isNegative ? `-${result}` : result;
}