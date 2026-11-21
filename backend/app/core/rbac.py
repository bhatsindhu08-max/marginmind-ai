from enum import Enum
from typing import List
from fastapi import HTTPException, status


class UserRole(str, Enum):
    BUSINESS_OWNER = "business_owner"
    FINANCE_MANAGER = "finance_manager"
    PROCUREMENT_MANAGER = "procurement_manager"
    PRODUCTION_MANAGER = "production_manager"


# Permissions Matrix
ROLE_PERMISSIONS = {
    UserRole.BUSINESS_OWNER: [
        "view:all",
        "edit:all",
        "approve:decisions",
        "manage:users",
        "manage:settings",
        "export:reports",
        "create:business",
    ],
    UserRole.FINANCE_MANAGER: [
        "view:all",
        "edit:financials",
        "edit:costs",
        "edit:margins",
        "edit:pricing",
        "view:decisions",
        "request:recalculation",
        "export:reports",
    ],
    UserRole.PROCUREMENT_MANAGER: [
        "view:suppliers",
        "edit:suppliers",
        "view:materials",
        "edit:quotations",
        "view:shocks",
        "view:purchases",
        "export:reports",
    ],
    UserRole.PRODUCTION_MANAGER: [
        "view:boms",
        "edit:boms",
        "view:inventory",
        "edit:inventory",
        "view:production_costs",
        "view:orders",
        "view:ordersure",
        "export:reports",
    ],
}


def check_role_permission(user_role: str, required_permission: str) -> bool:
    try:
        role_enum = UserRole(user_role)
    except ValueError:
        return False
    
    # Business owner has master permission
    if role_enum == UserRole.BUSINESS_OWNER:
        return True

    permissions = ROLE_PERMISSIONS.get(role_enum, [])
    return required_permission in permissions or "view:all" in permissions and required_permission.startswith("view:")


def enforce_roles(user_role: str, allowed_roles: List[UserRole]):
    if user_role not in [r.value for r in allowed_roles] and user_role != UserRole.BUSINESS_OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation not permitted for role '{user_role}'. Required roles: {[r.value for r in allowed_roles]}"
        )
