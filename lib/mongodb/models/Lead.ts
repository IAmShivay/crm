import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  _id: string;
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  source: string;
  value: number;
  assignedTo?: string;
  tags: string[];
  notes?: string;
  customFields: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>({
  workspaceId: {
    type: String,
    ref: 'Workspace',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'new'
  },
  source: {
    type: String,
    default: 'manual',
    trim: true
  },
  value: {
    type: Number,
    default: 0,
    min: 0
  },
  assignedTo: {
    type: String,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  customFields: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: String,
    ref: 'User',
    required: true
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
  LeadSchema.index({ workspaceId: 1, status: 1 });
  LeadSchema.index({ workspaceId: 1, assignedTo: 1 });
  LeadSchema.index({ workspaceId: 1, createdAt: -1 });
  LeadSchema.index({ email: 1 });
  LeadSchema.index({ createdBy: 1 });
  LeadSchema.index({ tags: 1 });
}

export const Lead = mongoose.models?.Lead || mongoose.model<ILead>('Lead', LeadSchema);
