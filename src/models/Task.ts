import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: Date;
  customerId: mongoose.Types.ObjectId | null;
  assignedEmployeeId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  lastUpdatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
  },
  assignedEmployeeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned employee is required'],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
  },
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Last updater is required'],
  },
}, {
  timestamps: true,
});

// Add indexes for common queries
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ assignedEmployeeId: 1 });
TaskSchema.index({ customerId: 1 });
TaskSchema.index({ createdBy: 1 });

// Add text index for search
TaskSchema.index({ title: 'text', description: 'text' });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema); 