# User Story

As a BuggyBoard user,
I want to delete bugs,
So that I can remove bugs that are incorrect or no longer needed.


# Design

- The "Edit bug" modal should have a "delete" button.
- Clicking Delete opens a confirmation modal instead of immediately deleting the bug.
- The confirmation identifies the bug by ID and warns that deletion is permanent.
- The confirmation modal has a "Delete" button, a "Cancel" button, and an X close control.
- The bug is deleted only after the user confirms. A successful deletion closes the modal and removes the bug from the database and board.
- Canceling the confirmation, clicking its X, or pressing Escape closes only the confirmation and returns to the Edit bug modal without changing or deleting the bug.
- Clicking outside the confirmation modal does not confirm or cancel deletion.
- If deletion fails, the bug remains and the user is shown an error in the Edit bug modal.


# Acceptance Criteria

Scenario: Edit bug modal displays a delete button
  Given the user is authenticated into the app
  And the user is on the board page
  And there are bugs in the database
  When the user opens the edit modal for a bug
  Then the modal displays a delete button

Scenario: Delete button opens a confirmation modal without deleting
  Given the user is authenticated into the app
  And the user is on the board page
  And there are bugs in the database
  When the user opens the edit modal for a bug
  And the user clicks the delete button
  Then a confirmation modal identifies the selected bug
  And the bug remains in the database and on the board

Scenario: User confirms deleting a bug
  Given the user is authenticated into the app
  And the user is on the board page
  And there are bugs in the database
  And the confirmation modal is open for a bug
  When the user confirms deletion
  Then the bug is removed from the database
  And the confirmation and edit modals are closed
  And the board no longer displays that bug

Scenario: User cancels deleting a bug
  Given the user is authenticated into the app
  And the user is on the board page
  And there are bugs in the database
  And the confirmation modal is open for a bug
  When the user cancels deletion
  Then the confirmation modal is closed
  And the edit modal remains open with its values unchanged
  And the bug remains unchanged in the database and on the board

Scenario Outline: User dismisses delete confirmation without deleting
  Given the user is authenticated into the app
  And the confirmation modal is open for a bug
  When the user <dismisses> the confirmation
  Then the confirmation modal closes without deleting the bug
  And the edit modal remains open

  Examples:
    | dismisses      |
    | clicks the X   |
    | presses Escape |

Scenario: Clicking outside the delete confirmation does not delete the bug
  Given the user is authenticated into the app
  And the confirmation modal is open for a bug
  When the user clicks outside the confirmation
  Then the confirmation remains open
  And the bug is not deleted
