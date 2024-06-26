import Is from "@/compiler/Is";
import Utils from "@/utils/Utils";
import ComputeKits from "@/compiler/ComputeKits";

export default class MathKits {
    /** @see https://www.cnblogs.com/jialuchun/p/6559422.html */
    public static factorial(x: number): number {
        if(x < 0) {
            return NaN;
        } else if(x === 0 || x === 1) {
            return 1;
        } else if(!Is.float(x)) {
            for(let i = x - 1; i >= 1; i--) {
                x *= i;
            }
            return x;
        }

        return MathKits.gamma(x + 1);
    }

    /** @see https://rosettacode.org/wiki/Gamma_function#JavaScript */
    public static gamma(x: number): number {
        const p = [
            0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
        ];
    
        const g = 7;
        if(x < 0.5) {
            return Math.PI / (Math.sin(Math.PI * x) * MathKits.gamma(1 - x));
        }
    
        x -= 1;
        var a = p[0];
        const t = x + g + 0.5;
        for(var i = 1; i < p.length; i++) {
            a += p[i] / (x + i);
        }
    
        return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
    }

    public static order(nums: number[]): number[] {
        var result: number[] = [];
        for(let i = 0; i < nums.length; i++) {
            if(result.length === 0) {
                result.push(nums[i]);
                continue;
            }

            let j = 0;
            while(j < result.length && nums[i] > result[j]) j++;
            result = Utils.arrayPut(result, j, nums[i]);
        }
        return result;
    }

    public static total(...nums: number[]): number {
        var sum = 0;
        for(let i = 0; i < nums.length; i++) {
            sum += nums[i];
        }
        return sum;
    }

    public static mean(...nums: number[]): number {
        return MathKits.total(...nums) / nums.length;
    }

    public static median(...nums: number[]): number {
        var ordered = MathKits.order([...nums]);
        return (
            ordered.length % 2 !== 0
            ? ordered[ordered.length / 2 - .5]
            : MathKits.mean(ordered[ordered.length / 2], ordered[ordered.length / 2 - 1])
        );
    }

    public static stdev(...nums: number[]): number {
        var average = MathKits.mean(...nums);
        var devPowList = [];
        for(let i = 0; i < nums.length; i++) {
            devPowList.push(MathKits.safePow(nums[i] - average, 2));
        }

        return Math.sqrt(MathKits.total(...devPowList) / (nums.length - 1));
    }

    public static stdevp(...nums: number[]): number {
        var average = MathKits.mean(...nums);
        var devPowList = [];
        for(let i = 0; i < nums.length; i++) {
            devPowList.push(MathKits.safePow(nums[i] - average, 2));
        }

        return Math.sqrt(MathKits.total(...devPowList) / nums.length);
    }

    public static nAr(n: number, r: number): number {
        if(n < r || n < 0 || r < 0) return NaN;
        return MathKits.factorial(n) / MathKits.factorial(n - r);
    }

    public static nCr(n: number, r: number): number {
        if(n < r || n < 0 || r < 0) return NaN;
        if(r === 0) return 1;
        return MathKits.factorial(n) / (MathKits.factorial(r) * MathKits.factorial(n - r));
    }

    public static safeTan(x: number): number {
        var result = Math.tan(x);
        if(result > 136059276645184) return NaN;
        if(result < -286411383293068) return NaN;
        return result;
    }

    public static safePow(x: number, y: number): number {
        if(y < 0) return 1 / MathKits.safePow(x, -y);

        var p = 1;
        for(let i = 0; i < y; i++) {
            p = ComputeKits.multiply(p, x);
        }

        return p;
    }

    public static unsafePow(x: number, y: number): number {
        if(y === 0) return 1;
        return y > 0 ? Math.pow(x, y) : (1 / Math.pow(x, -y));
    }

    public static gcd(a: number, b: number): number {
        var c;
        while(c !== 0) {
            c = a % b;
            if(c !== 0) {
                a = b;
                b = c;
            }
        }
        return b;
    }

    public static reduction(a: number, b: number): [number, number] {
        const commonDivisor = MathKits.gcd(a, b);
        return [ComputeKits.divide(a, commonDivisor), ComputeKits.divide(b, commonDivisor)];
    }

    public static toFrac(n: number): [number, number] {
        const numStr = n.toString();
        if(numStr.indexOf(".") === -1) return [n, 1];

        const exp = numStr.split(".")[1].length;
        return MathKits.reduction(parseInt(numStr.replace(".", "")), 10 ** exp);
    }
}
