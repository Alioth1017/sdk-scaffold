import { describe, expect, it } from "vitest";
import {test, test1} from "../main"

describe("test main", () => {
    it("test", () => {
        expect(test()).toBe(true)
    })
    it("test1", () => {
        expect(test1()).toBe(false)
    })
})