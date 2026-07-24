package com.baaki.repository;

import com.baaki.entity.Group;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Query-only repository (no CRUD) for the net balance formula:
 *
 * net_balance(user) = SUM(splits for expenses this user paid)
 *                    - SUM(this user's own splits)
 *                    + SUM(settlements this user paid_by - handed over cash)
 *                    - SUM(settlements this user paid_to - received cash)
 *
 * Deviates from spec Section 5.2's literal "+paid_to, -paid_by" - that
 * version only balances to zero if paid_by/paid_to are recorded backwards
 * from their plain-English meaning (paid_by would have to mean "the creditor
 * being paid down" instead of "who handed over the cash"). Keeping paid_by/
 * paid_to natural (matching expenses.paid_by, matching what any API client
 * would assume) and flipping the signs here instead: settling a debt should
 * move the payer's balance toward zero (+) and the receiver's balance
 * toward zero (-).
 *
 * Computed as one aggregate query in the database, not by pulling rows into
 * Java and summing - both for performance and because it's the correctness
 * signal the spec explicitly calls out.
 */
public interface BalanceRepository extends Repository<Group, Long> {

	@Query(value = """
			SELECT
			    gm.user_id AS user_id,
			    u.name AS user_name,
			    COALESCE(paid.total, 0) - COALESCE(owed.total, 0)
			        + COALESCE(settled_by_user.total, 0) - COALESCE(settled_to_user.total, 0) AS net_balance
			FROM group_members gm
			JOIN users u ON u.id = gm.user_id
			LEFT JOIN (
			    SELECT e.paid_by AS user_id, SUM(es.share_amount) AS total
			    FROM expense_splits es
			    JOIN expenses e ON e.id = es.expense_id
			    WHERE e.group_id = :groupId AND e.is_deleted = false
			    GROUP BY e.paid_by
			) paid ON paid.user_id = gm.user_id
			LEFT JOIN (
			    SELECT es.user_id AS user_id, SUM(es.share_amount) AS total
			    FROM expense_splits es
			    JOIN expenses e ON e.id = es.expense_id
			    WHERE e.group_id = :groupId AND e.is_deleted = false
			    GROUP BY es.user_id
			) owed ON owed.user_id = gm.user_id
			LEFT JOIN (
			    SELECT paid_by AS user_id, SUM(amount) AS total
			    FROM settlements
			    WHERE group_id = :groupId AND status = 'COMPLETED'
			    GROUP BY paid_by
			) settled_by_user ON settled_by_user.user_id = gm.user_id
			LEFT JOIN (
			    SELECT paid_to AS user_id, SUM(amount) AS total
			    FROM settlements
			    WHERE group_id = :groupId AND status = 'COMPLETED'
			    GROUP BY paid_to
			) settled_to_user ON settled_to_user.user_id = gm.user_id
			WHERE gm.group_id = :groupId
			ORDER BY gm.user_id
			""", nativeQuery = true)
	List<UserBalanceProjection> computeBalances(@Param("groupId") Long groupId);
}
