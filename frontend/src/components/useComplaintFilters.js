import { useState, useMemo } from "react";

export const useComplaintFilters = (complaints) => {
  const [dateFilter, setDateFilter] = useState("latest"); // 'latest' or 'oldest'
  const [priorityFilter, setPriorityFilter] = useState("all"); // 'all', 'high', 'medium', 'low'

  // Filter and sort complaints based on date and priority
  const getFilteredAndSortedComplaints = useMemo(() => {
    return (status) => {
      let filtered = complaints.filter(
        (complaint) => complaint.status === status
      );

      // Apply priority filter
      if (priorityFilter !== "all") {
        filtered = filtered.filter(
          (complaint) =>
            complaint.priority &&
            complaint.priority.toLowerCase() === priorityFilter
        );
      }

      // Apply date sorting
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);

        if (dateFilter === "latest") {
          return dateB - dateA; // Newest first
        } else {
          return dateA - dateB; // Oldest first
        }
      });

      return filtered;
    };
  }, [complaints, dateFilter, priorityFilter]);

  return {
    dateFilter,
    setDateFilter,
    priorityFilter,
    setPriorityFilter,
    getFilteredAndSortedComplaints,
  };
};
