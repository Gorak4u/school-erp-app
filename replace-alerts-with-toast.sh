#!/bin/bash

# Robust Script to Replace All alert() Calls with Toast Notifications
# This script systematically replaces browser alerts with proper toast notifications

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SRC_DIR="src"
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="alert-replacement-log.txt"

# Files to process (from our analysis)
FILES=(
    "app/students/components/StudentForm.tsx"
    "app/students/components/StudentFines.tsx"
    "app/fees/components/FeeTabContent.tsx"
    "app/teachers/components/TeacherForm.tsx"
    "app/teachers/page.tsx"
    "app/class-teachers/page.tsx"
    "app/expenses/ExpenseForm.tsx"
    "app/fines/rules/page.tsx"
    "app/fines/waiver-requests/page.tsx"
    "app/(auth)/billing/page.tsx"
    "app/admin/plans/components/PromoCodeManagement.tsx"
    "app/admin/layout.tsx"
    "app/fees/components/BulkFeeAssignmentForm.tsx"
    "app/fees/components/discount/DiscountApprovalQueue.tsx"
    "app/fees/components/discount/EnhancedDiscountApprovalQueue.tsx"
    "app/students/components/StudentProfileModal.tsx"
    "app/students/components/ExitStudentModal.tsx"
    "app/teachers/components/TeacherProfileModal.tsx"
    "app/teachers/components/ClassTeacherAssignments.tsx"
    "components/BulkFineModal.tsx"
    "components/settings/ThemeManager.tsx"
    "app/students/components/ai-form/StudentFormAIContainer.tsx"
    "app/students/components/ai-form/hooks/useFormValidation.ts"
)

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup
create_backup() {
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    for file in "${FILES[@]}"; do
        if [ -f "$SRC_DIR/$file" ]; then
            mkdir -p "$BACKUP_DIR/$(dirname "$file")"
            cp "$SRC_DIR/$file" "$BACKUP_DIR/$file"
            log "Backed up: $file"
        fi
    done
}

# Check if file has toast import
has_toast_import() {
    local file="$1"
    grep -q "import.*toast.*from" "$file" || grep -q "import.*{.*showSuccessToast.*}" "$file" || grep -q "import.*{.*showErrorToast.*}" "$file"
}

# Add toast import if missing
add_toast_import() {
    local file="$1"
    local temp_file=$(mktemp)
    
    # Find the last import statement
    local last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
    
    if [ -n "$last_import_line" ]; then
        # Add toast import after the last import
        head -n "$last_import_line" "$file" > "$temp_file"
        echo "import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from '@/lib/toastUtils';" >> "$temp_file"
        tail -n +$((last_import_line + 1)) "$file" >> "$temp_file"
        
        mv "$temp_file" "$file"
        log "Added toast import to: $file"
    fi
}

# Determine toast type based on alert content
determine_toast_type() {
    local alert_content="$1"
    
    # Convert to lowercase for case-insensitive matching
    local content=$(echo "$alert_content" | tr '[:upper:]' '[:lower:]')
    
    if [[ "$content" =~ (error|failed|fail|invalid|cannot|unable|not|wrong) ]]; then
        echo "showErrorToast"
    elif [[ "$content" =~ (success|completed|saved|created|updated|deleted|submitted) ]]; then
        echo "showSuccessToast"
    elif [[ "$content" =~ (warning|warn|caution|attention) ]]; then
        echo "showWarningToast"
    else
        echo "showInfoToast"
    fi
}

# Extract title and message from alert content
extract_toast_content() {
    local alert_content="$1"
    
    # Remove alert( and trailing )
    local content=$(echo "$alert_content" | sed 's/alert(//g' | sed 's/)$//g')
    
    # Handle different alert patterns
    if [[ "$content" =~ ^\'.*\'$ ]] || [[ "$content" =~ ^\".*\"$ ]]; then
        # Simple string: alert('message')
        local message=$(echo "$content" | sed "s/^'//g" | sed "s/'$//g" | sed 's/^"//g' | sed 's/"$//g')
        echo "Error" "$message"  # Default title for simple alerts
    elif [[ "$content" =~ ^`.*\`.*$ ]]; then
        # Template literal with newlines: alert(`title\nmessage`)
        local clean_content=$(echo "$content" | sed 's/^`//g' | sed 's/`$//g')
        local first_line=$(echo "$clean_content" | head -1)
        local rest=$(echo "$clean_content" | tail -n +2 | tr '\n' ' ' | sed 's/^ *//g')
        
        if [ -n "$rest" ]; then
            echo "$first_line" "$rest"
        else
            echo "Error" "$first_line"
        fi
    elif [[ "$content" =~ \$\{.*\} ]]; then
        # Template literal with variables: alert(`Error: ${error.message}`)
        echo "Error" "$content"
    else
        # Concatenated string: alert('Error: ' + error.message)
        echo "Error" "$content"
    fi
}

# Replace alert calls in a file
replace_alerts_in_file() {
    local file="$1"
    local temp_file=$(mktemp)
    local replacements=0
    
    log "Processing: $file"
    
    # Ensure toast import exists
    if ! has_toast_import "$file"; then
        add_toast_import "$file"
    fi
    
    # Process the file line by line
    while IFS= read -r line; do
        local line_number=$((replacements + 1))
        
        # Check for alert() calls
        if [[ "$line" =~ alert\( ]]; then
            # Extract the full alert call (handles multi-line)
            local alert_call=$(echo "$line" | grep -o "alert([^)]*)" || echo "$line")
            
            if [ -n "$alert_call" ]; then
                # Determine toast type and content
                local toast_type=$(determine_toast_type "$alert_call")
                local title_message=$(extract_toast_content "$alert_call")
                local title=$(echo "$title_message" | cut -d' ' -f1)
                local message=$(echo "$title_message" | cut -d' ' -f2-)
                
                # Create replacement
                local replacement="$toast_type('$title'"
                if [ -n "$message" ] && [ "$message" != "$title" ]; then
                    replacement="$replacement, '$message'"
                fi
                replacement="$replacement);"
                
                # Replace the alert call
                line=$(echo "$line" | sed "s/alert([^)]*)/$replacement/g")
                
                ((replacements++))
                log "  Line $line_number: alert() → $toast_type"
            fi
        fi
        
        echo "$line" >> "$temp_file"
    done < "$file"
    
    # Move temp file back to original
    mv "$temp_file" "$file"
    
    if [ $replacements -gt 0 ]; then
        log "  Replaced $replacements alert(s) in $file"
    else
        warning "  No alerts found in $file"
    fi
}

# Special handling for complex patterns
handle_complex_patterns() {
    local file="$1"
    
    # Handle multi-line alert calls
    sed -i.tmp ':a;N;$!ba;s/alert(\n\s*'\''\([^'\'']*\)'\''\n\s*'\''\([^'\'']*\)'\''\n\s*)/showErrorToast('\''\1'\'', '\''\2'\'')/g' "$file"
    
    # Handle template literal alerts with newlines
    sed -i.tmp 's/alert(`\([^`]*\)\n\([^`]*\)`)\/showErrorToast('\''\1'\'', '\''\2'\'')/g' "$file"
    
    # Handle concatenated string alerts
    sed -i.tmp 's/alert('\''\([^'\'']*\)'\'' \+ \([^)]*\))/showErrorToast('\''\1'\'', \2)/g' "$file"
    
    # Clean up temp files
    rm -f "$file.tmp"
}

# Validate TypeScript syntax
validate_syntax() {
    local file="$1"
    
    # Check if the file is still valid TypeScript
    if command -v npx >/dev/null 2>&1; then
        if npx tsc --noEmit --skipLibCheck "$file" 2>/dev/null; then
            log "  ✓ TypeScript syntax valid for $file"
        else
            error "  ✗ TypeScript syntax error in $file"
            return 1
        fi
    else
        warning "  TypeScript compiler not found, skipping syntax check"
    fi
    
    return 0
}

# Main processing function
process_file() {
    local file="$1"
    local full_path="$SRC_DIR/$file"
    
    if [ ! -f "$full_path" ]; then
        warning "File not found: $file"
        return 1
    fi
    
    log "=== Processing $file ==="
    
    # Create a working copy
    cp "$full_path" "$full_path.working"
    
    # Replace alerts
    replace_alerts_in_file "$full_path.working"
    
    # Handle complex patterns
    handle_complex_patterns "$full_path.working"
    
    # Validate syntax
    if validate_syntax "$full_path.working"; then
        # If valid, replace the original
        mv "$full_path.working" "$full_path"
        log "✅ Successfully processed: $file"
    else
        # If invalid, restore from backup
        error "❌ Syntax error in $file, reverting changes"
        if [ -f "$BACKUP_DIR/$file" ]; then
            cp "$BACKUP_DIR/$file" "$full_path"
        fi
        return 1
    fi
    
    return 0
}

# Generate summary report
generate_report() {
    local total_files=${#FILES[@]}
    local processed_files=0
    local total_alerts=0
    
    log "=== SUMMARY REPORT ==="
    log "Total files to process: $total_files"
    
    for file in "${FILES[@]}"; do
        if [ -f "$SRC_DIR/$file" ]; then
            ((processed_files++))
            # Count remaining alerts
            local alerts=$(grep -c "alert(" "$SRC_DIR/$file" 2>/dev/null || echo "0")
            total_alerts=$((total_alerts + alerts))
            
            if [ $alerts -eq 0 ]; then
                log "✅ $file - All alerts replaced"
            else
                warning "⚠️  $file - $alerts alert(s) remaining"
            fi
        else
            warning "❌ $file - File not found"
        fi
    done
    
    log "=== FINAL RESULTS ==="
    log "Files processed: $processed_files/$total_files"
    log "Total alerts remaining: $total_alerts"
    log "Backup created: $BACKUP_DIR"
    log "Log file: $LOG_FILE"
    
    if [ $total_alerts -eq 0 ]; then
        log "🎉 SUCCESS: All alerts have been replaced with toasts!"
    else
        warning "⚠️  Some alerts remain. Manual review may be needed."
    fi
}

# Main execution
main() {
    log "Starting alert-to-toast replacement process..."
    log "Working directory: $(pwd)"
    
    # Create backup
    create_backup
    
    # Process each file
    local success_count=0
    local total_files=${#FILES[@]}
    
    for file in "${FILES[@]}"; do
        if process_file "$file"; then
            ((success_count++))
        fi
        echo ""  # Add spacing between files
    done
    
    # Generate final report
    generate_report
    
    log "=== NEXT STEPS ==="
    log "1. Review the changes with: git diff"
    log "2. Test the application to ensure functionality"
    log "3. Run TypeScript check: npm run build"
    log "4. Commit changes if everything works: git add . && git commit -m 'Replace all alerts with toast notifications'"
    log "5. If issues occur, restore from backup: cp -r $BACKUP_DIR/* src/"
    
    if [ $success_count -eq $total_files ] && [ $total_alerts -eq 0 ]; then
        log "🎉 All files processed successfully!"
        exit 0
    else
        warning "Some files had issues. Please review the log."
        exit 1
    fi
}

# Run main function
main "$@"
