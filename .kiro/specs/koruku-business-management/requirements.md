# Requirements Document

## Introduction

The Koruku Business Management System is a single-page web application designed for Mezokuru web development business to manage clients, projects, invoices, and business operations. The System provides real-time data synchronization through Supabase, enabling the business owner to track revenue, manage client relationships, monitor project support periods, and handle invoicing workflows from any location with internet access.

## Glossary

- **System**: The Koruku Business Management System web application
- **User**: The authenticated business owner accessing the System
- **Client Record**: A database entry representing a business customer with contact information
- **Project Record**: A database entry representing a web development project with associated support period
- **Invoice Record**: A database entry representing a billing document with payment status
- **Support Period**: The time duration (in months) during which post-launch support is provided for a project
- **Invoice Number**: A unique identifier following the format PREFIX-YYYY-XXX (e.g., MZK-2025-001)
- **Overdue Invoice**: An Invoice Record with status not equal to 'paid' and due date before current date
- **Active Client**: A Client Record with the active flag set to true
- **Dashboard**: The main overview page displaying business statistics and recent activity
- **Supabase**: The backend database and authentication service provider

## Requirements

### Requirement 1: User Authentication

**User Story:** As a business owner, I want to securely access my business data through email and password authentication, so that my sensitive business information remains protected.

#### Acceptance Criteria

1. WHEN the User navigates to the System URL, THE System SHALL display a login page with email and password input fields.
2. WHEN the User submits valid credentials, THE System SHALL authenticate the User through Supabase Auth and redirect to the Dashboard.
3. WHEN the User submits invalid credentials, THE System SHALL display an error message "Invalid email or password" without revealing which field is incorrect.
4. WHEN the User session expires after 24 hours of inactivity, THE System SHALL redirect the User to the login page with message "Session expired. Please login again."
5. WHEN the User clicks the logout button, THE System SHALL terminate the session and redirect to the login page.

### Requirement 2: Client Management

**User Story:** As a business owner, I want to create, view, update, and delete client records, so that I can maintain an accurate database of my business customers.

#### Acceptance Criteria

1. WHEN the User navigates to the Clients page, THE System SHALL display a table containing all Client Records with columns for business name, contact name, email, phone, and active status.
2. WHEN the User enters text into the search field, THE System SHALL filter the displayed Client Records to show only those where business name, contact name, or email contains the search text (case-insensitive).
3. WHEN the User clicks the "Add Client" button, THE System SHALL display a modal form with fields for business (required, 2-200 characters), contact (required, 2-100 characters), email (required, valid format, unique, max 255 characters), phone (required, max 20 characters), address (optional, max 500 characters), and notes (optional, max 2000 characters).
4. WHEN the User submits a valid client form, THE System SHALL create a new Client Record in the database and display a success notification "Client added successfully."
5. WHEN the User attempts to submit a client form with an email that already exists, THE System SHALL display an error message "This email already exists" and prevent submission.
6. WHEN the User clicks the edit button on a Client Record, THE System SHALL display a modal form pre-populated with the client's current data.
7. WHEN the User clicks the delete button on a Client Record that has associated Project Records or Invoice Records, THE System SHALL display a confirmation dialog "Cannot delete client with X active projects and Y invoices. Mark as inactive instead?"
8. WHEN the User marks a Client Record as inactive, THE System SHALL set the active flag to false and exclude the client from active client dropdowns.

### Requirement 3: Project Management

**User Story:** As a business owner, I want to track all my web development projects with their support periods, so that I can proactively manage client support obligations and identify expiring support contracts.

#### Acceptance Criteria

1. WHEN the User navigates to the Projects page, THE System SHALL display a table containing all Project Records with columns for project name, client business name, status, start date, support end date, and days remaining.
2. WHEN the User clicks the "New Project" button, THE System SHALL display a modal form with fields for name (required, 3-200 characters), client (required dropdown of Active Clients), status (required enum), start date (required, cannot be more than 30 days in future), support months (required, 0-60), description (optional, max 2000 characters), tech stack (optional array), live URL (optional, valid URL format), and GitHub URL (optional, valid URL format).
3. WHEN the User enters a start date and support months value, THE System SHALL automatically calculate and display the support end date as start date plus support months.
4. WHEN the User submits a valid project form, THE System SHALL create a new Project Record with the calculated support end date and display a success notification "Project created successfully."
5. WHEN a Project Record has a support end date within 30 days of the current date, THE System SHALL display a warning icon next to the project in the table.
6. WHEN the User filters projects by status, THE System SHALL display only Project Records matching the selected status value.
7. WHEN the User clicks on a Project Record, THE System SHALL display a detail modal showing project information, client details, support period countdown, and related Invoice Records.

### Requirement 4: Invoice Management

**User Story:** As a business owner, I want to create, track, and manage invoices with automatic numbering and status tracking, so that I can efficiently handle billing and monitor payment status.

#### Acceptance Criteria

1. WHEN the User navigates to the Invoices page, THE System SHALL display a table containing all Invoice Records with columns for invoice number, client business name, amount, date, due date, status, and action buttons.
2. WHEN the User clicks the "New Invoice" button, THE System SHALL display a modal form with an auto-generated invoice number following the format PREFIX-YYYY-XXX where PREFIX is from settings, YYYY is current year, and XXX is the next sequential number padded to 3 digits.
3. WHEN the User selects a client in the invoice form, THE System SHALL populate the project dropdown with only Project Records associated with the selected client.
4. WHEN the User submits a valid invoice form, THE System SHALL create a new Invoice Record with fields for invoice number (unique), client (required), project (optional), amount (required, 0.01-999999.99 with 2 decimals), date (required, within 1 year past or future), due date (required, must be >= invoice date, within 1 year from invoice date), status (required enum), description (required, 5-1000 characters), and notes (optional, max 2000 characters).
5. WHEN an Invoice Record has status not equal to 'paid' and due date before the current date, THE System SHALL automatically update the status to 'overdue' and highlight the table row in light red.
6. WHEN the User clicks the "Mark as Paid" button on an Invoice Record, THE System SHALL update the status to 'paid', set paid_date to current date, and display a success notification "Invoice marked as paid."
7. WHEN the User attempts to create an invoice with a duplicate invoice number, THE System SHALL display an error message "Invoice number already exists. Suggested: [next available number]."
8. WHEN the User filters invoices by status, THE System SHALL display only Invoice Records matching the selected status value.

### Requirement 5: Dashboard Overview

**User Story:** As a business owner, I want to see an overview of my business performance at a glance, so that I can quickly assess revenue, pending payments, and upcoming support obligations.

#### Acceptance Criteria

1. WHEN the User navigates to the Dashboard, THE System SHALL display a stat card showing total revenue calculated as the sum of all Invoice Records with status 'paid' for the current year.
2. WHEN the User navigates to the Dashboard, THE System SHALL display a stat card showing the count of Invoice Records with status 'paid' for the current year.
3. WHEN the User navigates to the Dashboard, THE System SHALL display a stat card showing the count of Invoice Records with status 'sent'.
4. WHEN the User navigates to the Dashboard, THE System SHALL display a stat card showing the count of Invoice Records with status 'overdue'.
5. WHEN the User navigates to the Dashboard, THE System SHALL display a stat card showing outstanding amount calculated as the sum of all Invoice Records with status 'draft', 'sent', or 'overdue'.
6. WHEN the User navigates to the Dashboard, THE System SHALL display a table showing the 10 most recent Invoice Records ordered by date descending.
7. WHEN one or more Project Records have support end dates within 30 days of the current date and support end date is not in the past, THE System SHALL display an alert banner stating "X projects have support ending soon" with a link to the Projects page.

### Requirement 6: Business Settings Configuration

**User Story:** As a business owner, I want to configure business information and default settings, so that the System reflects my business details and preferences.

#### Acceptance Criteria

1. WHEN the User navigates to the Settings page, THE System SHALL display a form with sections for business information (name, email, phone, bank details), invoice settings (prefix, default payment terms in days), and project settings (default support months).
2. WHEN the User loads the Settings page, THE System SHALL retrieve and display current settings values from the settings table in Supabase.
3. WHEN the User modifies settings values and clicks "Save", THE System SHALL update the corresponding records in the settings table and display a success notification "Settings saved successfully."
4. WHEN the User enters an invalid email format in business information, THE System SHALL display an error message "Please enter a valid email address" and prevent submission.

### Requirement 7: Data Export

**User Story:** As a business owner, I want to export all my business data to a JSON file, so that I can create backups and maintain data portability.

#### Acceptance Criteria

1. WHEN the User clicks the "Export Data" button in the Settings page, THE System SHALL retrieve all Client Records, Project Records, Invoice Records, and settings from Supabase.
2. WHEN the data retrieval is complete, THE System SHALL generate a JSON file containing all retrieved data with metadata including version number and export timestamp.
3. WHEN the JSON file is generated, THE System SHALL trigger a browser download with filename format "koruku-backup-YYYY-MM-DD.json" where YYYY-MM-DD is the current date.
4. WHEN the download is triggered, THE System SHALL display a success notification "Data exported successfully."

### Requirement 8: Search and Filter Functionality

**User Story:** As a business owner, I want to search and filter records across all entity types, so that I can quickly find specific clients, projects, or invoices.

#### Acceptance Criteria

1. WHEN the User enters text into a search field on any list page, THE System SHALL filter displayed records within 300 milliseconds using debounced input.
2. WHEN the User applies a filter on any list page, THE System SHALL display only records matching the filter criteria and show a "Clear filters" button.
3. WHEN no records match the search or filter criteria, THE System SHALL display a message "No results found for '[query]'. Try a different search term."
4. WHEN the User clicks a sortable column header, THE System SHALL sort the table by that column in ascending order on first click and descending order on second click.

### Requirement 9: Form Validation

**User Story:** As a business owner, I want immediate feedback on form input errors, so that I can correct mistakes before submission and maintain data quality.

#### Acceptance Criteria

1. WHEN the User enters data into a required form field, THE System SHALL display a red asterisk (*) next to the field label and set the aria-required attribute to true.
2. WHEN the User leaves a required field empty and moves focus to another field, THE System SHALL display an error message "This field is required" below the field.
3. WHEN the User enters an email address in an email field, THE System SHALL validate the format using regex pattern and display "Please enter a valid email address" if invalid.
4. WHEN the User enters a URL in a URL field, THE System SHALL validate the format and display "Please enter a valid URL (e.g., https://example.com)" if invalid.
5. WHEN any form field contains validation errors, THE System SHALL disable the submit button until all errors are resolved.
6. WHEN the User submits a form with valid data, THE System SHALL display a loading state on the submit button and disable all form inputs until the operation completes.

### Requirement 10: Error Handling and Recovery

**User Story:** As a business owner, I want clear error messages and recovery options when problems occur, so that I can understand issues and continue working without data loss.

#### Acceptance Criteria

1. WHEN a network error occurs during a data operation, THE System SHALL display a toast notification "Connection lost. Please check your internet." with a retry button.
2. WHEN a Supabase authentication error occurs, THE System SHALL redirect the User to the login page and display the appropriate error message.
3. WHEN a database constraint violation occurs, THE System SHALL display a user-friendly error message explaining the issue without exposing technical details.
4. WHEN the User loses internet connectivity, THE System SHALL display a persistent banner "You're offline. Changes will sync when connection is restored." and disable all data-modifying actions.
5. WHEN a data fetch operation fails after 3 retry attempts, THE System SHALL display an error message with a manual "Retry" button.

### Requirement 11: Responsive Design

**User Story:** As a business owner, I want to access the System from any device, so that I can manage my business on desktop, tablet, or mobile.

#### Acceptance Criteria

1. WHEN the User accesses the System on a screen width less than 768 pixels, THE System SHALL collapse the sidebar navigation into a hamburger menu.
2. WHEN the User accesses data tables on a screen width less than 768 pixels, THE System SHALL enable horizontal scrolling to view all columns.
3. WHEN the User interacts with any button or interactive element on a touch device, THE System SHALL ensure the touch target size is at least 44x44 pixels.
4. WHEN the User resizes the browser window, THE System SHALL adjust the layout without requiring a page refresh.

### Requirement 12: Accessibility Compliance

**User Story:** As a business owner who values inclusive design, I want the System to be accessible to users with disabilities, so that it meets WCAG 2.1 AA standards.

#### Acceptance Criteria

1. WHEN the User navigates the System using only a keyboard, THE System SHALL provide visible focus indicators with 2-pixel gold outline on all interactive elements.
2. WHEN the User presses the Tab key, THE System SHALL move focus through interactive elements in a logical order from left-to-right and top-to-bottom.
3. WHEN the User presses the Escape key while a modal is open, THE System SHALL close the modal and return focus to the trigger element.
4. WHEN the System displays dynamic content updates, THE System SHALL announce changes to screen readers using ARIA live regions.
5. WHEN the System displays text content, THE System SHALL ensure color contrast ratio of at least 4.5:1 for normal text and 3:1 for large text and UI components.
6. WHEN the System displays status information using color, THE System SHALL also provide a text label or icon to convey the same information.
7. WHEN the User encounters a form error, THE System SHALL announce the error message to screen readers using aria-invalid and aria-describedby attributes.
