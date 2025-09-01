import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  _id: string;
  workspaceId: string;
  planId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  dodoSubscriptionId?: string;
  dodoCustomerId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  workspaceId: {
    type: String,
    ref: 'Workspace',
    required: true,
    unique: true
  },
  planId: {
    type: String,
    ref: 'Plan',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing', 'unpaid'],
    default: 'active'
  },
  currentPeriodStart: {
    type: Date,
    required: true,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date
  },
  trialStart: {
    type: Date
  },
  trialEnd: {
    type: Date
  },
  dodoSubscriptionId: {
    type: String
  },
  dodoCustomerId: {
    type: String
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes (only create on server side to prevent client-side errors)
if (typeof window === 'undefined') {
  SubscriptionSchema.index({ workspaceId: 1 });
  SubscriptionSchema.index({ planId: 1 });
  SubscriptionSchema.index({ status: 1 });
  SubscriptionSchema.index({ currentPeriodEnd: 1 });
  SubscriptionSchema.index({ dodoSubscriptionId: 1 }, { sparse: true });
  SubscriptionSchema.index({ dodoCustomerId: 1 }, { sparse: true });
}

export const Subscription = mongoose.models?.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
