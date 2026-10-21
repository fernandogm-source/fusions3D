function attachDependencyIssues(documents, relations) {
  return documents.map((document) => {
    const dependencyIssues = [];

    for (const relation of relations) {
      const value = document[relation.field];
      const references = relation.array ? (Array.isArray(value) ? value : []) : [value];

      for (const reference of references) {
        if (reference === undefined && relation.array) {
          continue;
        }

        const referenceId = reference && typeof reference === 'object'
          ? reference._id?.toString()
          : reference?.toString();

        let message = null;
        if (!reference) {
          message = relation.missingMessage;
        } else if (reference.deletedAt) {
          message = relation.deletedMessage;
        } else if (reference.isActive === false) {
          message = relation.inactiveMessage;
        }

        if (message) {
          dependencyIssues.push({
            field: relation.field,
            message,
            ...(referenceId ? { referenceId } : {})
          });
        }
      }
    }

    return { ...document, dependencyIssues };
  });
}

module.exports = { attachDependencyIssues };
