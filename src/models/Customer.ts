import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICustomer extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  country?: string;
  visaType?: string;
  status: 'Lead' | 'Prospect' | 'Customer' | 'Inactive';
  temperature?: 'hot' | 'warm' | 'cold';
  source?: string;
  notes?: string;
  assignedTo?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  lastUpdatedBy?: mongoose.Types.ObjectId;
  tags: string[];
  importedAt?: Date;
  importBatch?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot be more than 100 characters'],
    },
    country: {
      type: String,
      trim: true,
      maxlength: [50, 'Country cannot be more than 50 characters'],
    },
    visaType: {
      type: String,
      trim: true,
      maxlength: [50, 'Visa type cannot be more than 50 characters'],
    },    status: {
      type: String,
      enum: ['Lead', 'Prospect', 'Customer', 'Inactive'],
      default: 'Lead',
    },
    temperature: {
      type: String,
      enum: ['hot', 'warm', 'cold'],
      default: 'warm',
    },
    source: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot be more than 1000 characters'],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: {
      type: [String],
      default: [],
    },
    importedAt: {
      type: Date,
    },
    importBatch: {
      type: String,
      maxlength: [100, 'Import batch ID cannot be more than 100 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
customerSchema.index({ email: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ assignedTo: 1 });
customerSchema.index({ createdBy: 1 });
customerSchema.index({ country: 1 });
customerSchema.index({ importBatch: 1 });

// Prevent re-compilation in development
const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);

export default Customer;
