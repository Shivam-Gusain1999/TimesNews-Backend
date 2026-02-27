import { describe, it, expect } from "vitest";
import { ROLES, ROLE_VALUES, PERMISSIONS } from "../../src/constants/roles.constant.js";

// ============================================================================
// RBAC CONSTANTS TESTS
// ============================================================================
describe("RBAC Constants", () => {

    describe("ROLES", () => {
        it("should define all 4 role types", () => {
            expect(ROLES.ADMIN).toBe("admin");
            expect(ROLES.EDITOR).toBe("editor");
            expect(ROLES.REPORTER).toBe("reporter");
            expect(ROLES.USER).toBe("user");
        });

        it("should have exactly 4 roles", () => {
            expect(Object.keys(ROLES)).toHaveLength(4);
        });
    });

    describe("ROLE_VALUES", () => {
        it("should contain all role values as an array", () => {
            expect(ROLE_VALUES).toContain("admin");
            expect(ROLE_VALUES).toContain("editor");
            expect(ROLE_VALUES).toContain("reporter");
            expect(ROLE_VALUES).toContain("user");
            expect(ROLE_VALUES).toHaveLength(4);
        });

        it("should not contain invalid roles", () => {
            expect(ROLE_VALUES).not.toContain("superadmin");
            expect(ROLE_VALUES).not.toContain("moderator");
        });
    });

    describe("PERMISSIONS", () => {
        describe("CAN_PUBLISH", () => {
            it("should allow Admin to publish", () => {
                expect(PERMISSIONS.CAN_PUBLISH).toContain(ROLES.ADMIN);
            });

            it("should allow Editor to publish", () => {
                expect(PERMISSIONS.CAN_PUBLISH).toContain(ROLES.EDITOR);
            });

            it("should NOT allow Reporter to publish", () => {
                expect(PERMISSIONS.CAN_PUBLISH).not.toContain(ROLES.REPORTER);
            });

            it("should NOT allow User to publish", () => {
                expect(PERMISSIONS.CAN_PUBLISH).not.toContain(ROLES.USER);
            });
        });

        describe("CAN_EDIT_OTHERS", () => {
            it("should allow Admin to edit others' content", () => {
                expect(PERMISSIONS.CAN_EDIT_OTHERS).toContain(ROLES.ADMIN);
            });

            it("should allow Editor to edit others' content", () => {
                expect(PERMISSIONS.CAN_EDIT_OTHERS).toContain(ROLES.EDITOR);
            });

            it("should NOT allow Reporter to edit others' content", () => {
                expect(PERMISSIONS.CAN_EDIT_OTHERS).not.toContain(ROLES.REPORTER);
            });
        });

        describe("CAN_DELETE_USERS", () => {
            it("should ONLY allow Admin to delete users", () => {
                expect(PERMISSIONS.CAN_DELETE_USERS).toContain(ROLES.ADMIN);
                expect(PERMISSIONS.CAN_DELETE_USERS).toHaveLength(1);
            });

            it("should NOT allow Editor to delete users", () => {
                expect(PERMISSIONS.CAN_DELETE_USERS).not.toContain(ROLES.EDITOR);
            });

            it("should NOT allow Reporter to delete users", () => {
                expect(PERMISSIONS.CAN_DELETE_USERS).not.toContain(ROLES.REPORTER);
            });
        });
    });

    describe("RBAC Role Hierarchy Logic", () => {
        it("Staff roles should include Admin, Editor, Reporter (not User)", () => {
            const staffRoles = [ROLES.ADMIN, ROLES.EDITOR, ROLES.REPORTER];
            expect(staffRoles).toContain(ROLES.ADMIN);
            expect(staffRoles).toContain(ROLES.EDITOR);
            expect(staffRoles).toContain(ROLES.REPORTER);
            expect(staffRoles).not.toContain(ROLES.USER);
        });

        it("Publisher roles should be a subset of staff roles", () => {
            const staffRoles = [ROLES.ADMIN, ROLES.EDITOR, ROLES.REPORTER];
            PERMISSIONS.CAN_PUBLISH.forEach((role) => {
                expect(staffRoles).toContain(role);
            });
        });

        it("Delete-user permission should be the most restrictive", () => {
            expect(PERMISSIONS.CAN_DELETE_USERS.length).toBeLessThan(
                PERMISSIONS.CAN_PUBLISH.length
            );
            expect(PERMISSIONS.CAN_DELETE_USERS.length).toBeLessThan(
                PERMISSIONS.CAN_EDIT_OTHERS.length
            );
        });
    });
});
