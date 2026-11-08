
export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
    readonly context: SecurityRuleContext;
    readonly cause: string = "firestore-permission-denied";

    constructor(context: SecurityRuleContext) {
        const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(context, null, 2)}`;
        super(message);
        this.context = context;
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = this.constructor.name;
    }
}
