import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspace extends Document {
  _id: string;
  name: string;
  slug: string;
  planId: string;
  subscriptionStatus: string;
  dodoCustomerId?: string;
  dodoSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  planId: {
    type: String,
    ref: 'Plan',
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing'],
    default: 'active'
  },
  dodoCustomerId: {
    type: String,
    sparse: true
  },
  dodoSubscriptionId: {
    type: String,
    sparse: true
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

// Additional indexes (only create on server side to prevent client-side errors)
if (typeof window === 'undefined') {
  WorkspaceSchema.index({ planId: 1 });
  WorkspaceSchema.index({ subscriptionStatus: 1 });
  WorkspaceSchema.index({ createdAt: -1 });
}

export const Workspace = mongoose.models?.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
