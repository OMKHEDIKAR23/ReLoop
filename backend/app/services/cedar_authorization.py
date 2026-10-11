from cedarpy import is_authorized


CEDAR_POLICIES = """
permit (
    principal,
    action == Action::"scan",
    resource == Resource::"waste"
);

permit (
    principal,
    action == Action::"view_history",
    resource == Resource::"scan_history"
);
"""


def check_authorization(action: str, resource: str) -> dict:
    """Evaluate an authorization request using the Cedar engine."""

    request = {
        "principal": 'User::"anonymous"',
        "action": f'Action::"{action}"',
        "resource": f'Resource::"{resource}"',
        "context": {},
    }

    entities = [
        {
            "uid": {
                "__entity": {
                    "type": "User",
                    "id": "anonymous",
                }
            },
            "attrs": {},
            "parents": [],
        }
    ]

    result = is_authorized(
        request,
        CEDAR_POLICIES,
        entities,
    )

    return {
        "decision": str(result.decision),
        "allowed": bool(result.allowed),
    }


def get_authorization_status() -> dict:
    """Run sample checks to verify Cedar is evaluating policies."""

    scan = check_authorization("scan", "waste")

    history = check_authorization(
        "view_history",
        "scan_history",
    )

    delete_history = check_authorization(
        "delete_history",
        "scan_history",
    )

    return {
        "engine": "Cedar",
        "checks": {
            "scan_waste": scan,
            "view_history": history,
            "delete_history": delete_history,
        },
    }